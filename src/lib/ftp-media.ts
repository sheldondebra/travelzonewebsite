import { Readable } from "stream";
import { Client } from "basic-ftp";
import type { FtpSettings } from "@/lib/settings-types";

const FTP_TIMEOUT_MS = 20_000;

export type FtpConnectionResult = {
  ok: boolean;
  message: string;
  remoteFolder: string;
  samplePublicUrl?: string;
};

function normalizeRemoteFolder(folder: string) {
  return folder
    .replace(/\\/g, "/")
    .split("/")
    .map((part) => part.trim())
    .filter((part) => part && part !== "." && part !== "..")
    .join("/");
}

function joinRemotePath(...parts: string[]) {
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
  } catch {
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

export async function testFtpConnection(settings: FtpSettings): Promise<FtpConnectionResult> {
  const remoteFolder = normalizeRemoteFolder(settings.remoteFolder) || "public_html/media";

  try {
    await withFtpClient(settings, async (client) => {
      await client.ensureDir(remoteFolder);
      await client.cd(remoteFolder);
      await client.list();
    });

    const samplePublicUrl = joinPublicMediaUrl(
      settings.publicBaseUrl.trim(),
      "uploads/connection-check.webp",
    );

    return {
      ok: true,
      message: `Connected. Folder ready at ${remoteFolder}.`,
      remoteFolder,
      samplePublicUrl,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : "FTP connection failed.";
    return {
      ok: false,
      message: message.slice(0, 240),
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
  const remoteRoot = normalizeRemoteFolder(settings.remoteFolder) || "public_html/media";
  const relativeDir = normalizeRemoteFolder(folder) || "uploads";
  const remoteDir = joinRemotePath(remoteRoot, relativeDir);

  await withFtpClient(settings, async (client) => {
    await client.ensureDir(remoteDir);
    const stream = Readable.from(buffer);
    await client.uploadFrom(stream, filename);
  });

  return joinPublicMediaUrl(
    settings.publicBaseUrl.trim(),
    joinRemotePath(relativeDir, filename),
  );
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
