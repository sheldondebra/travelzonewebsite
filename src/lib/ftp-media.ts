import { Readable, Writable } from "stream";
import { Client } from "basic-ftp";
import type { FtpSettings } from "@/lib/settings-types";

const FTP_TIMEOUT_MS = 20_000;
export const DEFAULT_FTP_REMOTE_FOLDER = "media";

/** Same-origin path served by `app/media/[...path]` (proxies FTP on Vercel). */
export function ftpPublicMediaPath(relativePath: string) {
  const normalized = relativePath.replace(/^\/+/, "");
  return `/media/${normalized}`;
}

const IMAGE_CONTENT_TYPES: Record<string, string> = {
  webp: "image/webp",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  gif: "image/gif",
  avif: "image/avif",
  svg: "image/svg+xml",
};

export type FtpConnectionResult = {
  ok: boolean;
  message: string;
  remoteFolder: string;
  samplePublicUrl?: string;
};

export function normalizeRemoteFolder(folder: string) {
  return folder
    .replace(/\\/g, "/")
    .replace(/^\/+/, "")
    .split("/")
    .map((part) => part.trim())
    .filter((part) => part && part !== "." && part !== "..")
    .join("/");
}

export function joinRemotePath(...parts: string[]) {
  return parts
    .map((part) => part.replace(/^\/+|\/+$/g, ""))
    .filter(Boolean)
    .join("/");
}

export function joinPublicMediaUrl(publicBaseUrl: string, relativePath: string) {
  const base = publicBaseUrl.replace(/\/+$/, "");
  const pathPart = relativePath.replace(/^\/+/, "");
  return `${base}/${pathPart}`;
}

function contentTypeForPath(filePath: string) {
  const ext = filePath.split(".").pop()?.toLowerCase() ?? "";
  return IMAGE_CONTENT_TYPES[ext] ?? "application/octet-stream";
}

function assertFtpConfig(settings: FtpSettings) {
  if (!settings.host.trim()) throw new Error("FTP host is required.");
  if (!settings.username.trim()) throw new Error("FTP username is required.");
  if (!settings.password.trim()) throw new Error("FTP password is required.");
  if (!settings.publicBaseUrl.trim()) {
    throw new Error("Public base URL is required (e.g. https://www.travelzonegh.org/media).");
  }
  try {
    const url = new URL(settings.publicBaseUrl.trim());
    if (url.protocol !== "http:" && url.protocol !== "https:") {
      throw new Error("Public base URL must start with http:// or https://");
    }
  } catch (error) {
    if (error instanceof Error && error.message.startsWith("Public base URL")) throw error;
    throw new Error("Public base URL is invalid.");
  }
}

async function withFtpClient<T>(
  settings: FtpSettings,
  work: (client: Client) => Promise<T>,
): Promise<T> {
  assertFtpConfig(settings);
  const client = new Client(FTP_TIMEOUT_MS);
  client.ftp.verbose = false;

  try {
    await client.access({
      host: settings.host.trim(),
      port: Number(settings.port) || 21,
      user: settings.username.trim(),
      password: settings.password,
      secure: settings.secure,
      secureOptions: settings.secure ? { rejectUnauthorized: false } : undefined,
    });
    return await work(client);
  } finally {
    client.close();
  }
}

function friendlyFtpError(message: string, remoteFolder: string) {
  const lower = message.toLowerCase();
  if (
    lower.includes("no such file") ||
    lower.includes("can't change directory") ||
    lower.includes("cannot change directory") ||
    lower.includes("550")
  ) {
    if (remoteFolder.includes("public_html")) {
      return `${message} Tip: many cPanel FTP accounts already start inside public_html — try remote folder "media" instead of "public_html/media".`;
    }
    return `${message} Tip: set Remote images folder relative to your FTP home (often just "media").`;
  }
  return message;
}

/** Collect FTP download into a Buffer. */
function bufferWritable() {
  const chunks: Buffer[] = [];
  const writable = new Writable({
    write(chunk, _encoding, callback) {
      chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
      callback();
    },
  });
  return {
    writable,
    toBuffer: () => Buffer.concat(chunks),
  };
}

export async function testFtpConnection(settings: FtpSettings): Promise<FtpConnectionResult> {
  const remoteFolder =
    normalizeRemoteFolder(settings.remoteFolder) || DEFAULT_FTP_REMOTE_FOLDER;
  const probeName = `connection-check-${Date.now()}.webp`;
  const probeRelative = joinRemotePath("uploads", probeName);

  try {
    await withFtpClient(settings, async (client) => {
      await client.ensureDir(joinRemotePath(remoteFolder, "uploads"));
      const probe = Buffer.from(
        "UklGRiQAAABXRUJQVlA4IBgAAAAwAQCdASoBAAEAAwA0JaQAA3AA/vuUAAA=",
        "base64",
      );
      await client.uploadFrom(Readable.from(probe), probeName);

      const { writable, toBuffer } = bufferWritable();
      await client.downloadTo(writable, probeName);
      if (toBuffer().length === 0) {
        throw new Error("FTP upload verification failed (empty download).");
      }

      try {
        await client.remove(probeName);
      } catch {
        // Probe cleanup is best-effort.
      }
    });

    const samplePublicUrl = ftpPublicMediaPath(probeRelative);

    return {
      ok: true,
      message: `Connected. Folder ready at ${remoteFolder}. Images are served via /media on the site.`,
      remoteFolder,
      samplePublicUrl,
    };
  } catch (error) {
    const raw = error instanceof Error ? error.message : "FTP connection failed.";
    return {
      ok: false,
      message: friendlyFtpError(raw, remoteFolder).slice(0, 320),
      remoteFolder,
    };
  }
}

export async function uploadViaFtp(
  settings: FtpSettings,
  folder: string,
  filename: string,
  buffer: Buffer,
): Promise<string> {
  const remoteRoot =
    normalizeRemoteFolder(settings.remoteFolder) || DEFAULT_FTP_REMOTE_FOLDER;
  const relativeDir = normalizeRemoteFolder(folder) || "uploads";
  const remoteDir = joinRemotePath(remoteRoot, relativeDir);
  const relativePath = joinRemotePath(relativeDir, filename);

  await withFtpClient(settings, async (client) => {
    await client.ensureDir(remoteDir);
    const stream = Readable.from(buffer);
    await client.uploadFrom(stream, filename);
  });

  // Always return a same-origin /media path so Vercel can proxy from FTP.
  return ftpPublicMediaPath(relativePath);
}

/**
 * Download a file from the configured FTP media root.
 * `relativePath` is under the public /media URL (e.g. tours/slug/file.webp).
 */
export async function downloadViaFtp(
  settings: FtpSettings,
  relativePath: string,
): Promise<{ buffer: Buffer; contentType: string }> {
  const remoteRoot =
    normalizeRemoteFolder(settings.remoteFolder) || DEFAULT_FTP_REMOTE_FOLDER;
  const safeRelative = normalizeRemoteFolder(relativePath);
  if (!safeRelative) {
    throw new Error("Invalid media path.");
  }

  const remotePath = joinRemotePath(remoteRoot, safeRelative);

  const buffer = await withFtpClient(settings, async (client) => {
    const { writable, toBuffer } = bufferWritable();
    await client.downloadTo(writable, remotePath);
    return toBuffer();
  });

  return {
    buffer,
    contentType: contentTypeForPath(safeRelative),
  };
}

export function isFtpUploadReady(settings: FtpSettings) {
  return (
    settings.enabled &&
    settings.lastTestOk &&
    Boolean(settings.host.trim()) &&
    Boolean(settings.username.trim()) &&
    Boolean(settings.password.trim()) &&
    Boolean(settings.publicBaseUrl.trim())
  );
}
