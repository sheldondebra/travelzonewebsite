"use client";

import { useActionState } from "react";
import {
  HiCheckCircle,
  HiCloudArrowUp,
  HiExclamationTriangle,
  HiFolderOpen,
  HiLink,
  HiServerStack,
  HiXCircle,
} from "react-icons/hi2";
import {
  disconnectFtpSettingsAction,
  saveFtpSettingsAction,
  testFtpSettingsAction,
} from "@/app/admin/actions/settings";
import { AdminNotice, AdminWidget } from "@/components/admin/AdminChrome";
import { useAdminActionFeedback } from "@/components/admin/AdminToastProvider";
import type { AdminSettingsView } from "@/lib/settings-types";

function Toggle({
  id,
  name,
  label,
  description,
  defaultChecked,
}: {
  id: string;
  name: string;
  label: string;
  description?: string;
  defaultChecked?: boolean;
}) {
  return (
    <label htmlFor={id} className="admin-settings-toggle">
      <input
        id={id}
        name={name}
        type="checkbox"
        defaultChecked={defaultChecked}
        className="mt-0.5 h-4 w-4 shrink-0 accent-brand-red"
      />
      <span>
        <span className="block text-[13px] font-semibold text-[#1d2327]">{label}</span>
        {description ? (
          <span className="admin-field-hint mt-0.5 block">{description}</span>
        ) : null}
      </span>
    </label>
  );
}

function StatusBanner({ settings }: { settings: AdminSettingsView["ftp"] }) {
  if (settings.lastTestOk && settings.enabled && settings.hasPassword) {
    return (
      <div className="flex items-start gap-3 rounded-xl border border-[#b8e6bf] bg-[#edf8ef] px-4 py-3">
        <HiCheckCircle className="mt-0.5 h-5 w-5 shrink-0 text-[#007017]" aria-hidden />
        <div>
          <p className="text-[13px] font-semibold text-[#007017]">Connected</p>
          <p className="mt-0.5 text-[12px] text-[#1d2327]">
            {settings.lastTestMessage || "FTP ready for uploads."}
          </p>
        </div>
      </div>
    );
  }

  if (settings.lastTestMessage && !settings.lastTestOk) {
    return (
      <div className="flex items-start gap-3 rounded-xl border border-[#f0c2c2] bg-[#fdf2f2] px-4 py-3">
        <HiXCircle className="mt-0.5 h-5 w-5 shrink-0 text-[#b32d2e]" aria-hidden />
        <div>
          <p className="text-[13px] font-semibold text-[#b32d2e]">Not connected</p>
          <p className="mt-0.5 text-[12px] text-[#1d2327]">{settings.lastTestMessage}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-start gap-3 rounded-xl border border-[#dcdcde] bg-[#f6f7f7] px-4 py-3">
      <HiExclamationTriangle className="mt-0.5 h-5 w-5 shrink-0 text-[#996800]" aria-hidden />
      <div>
        <p className="text-[13px] font-semibold text-[#1d2327]">Setup required</p>
        <p className="mt-0.5 text-[12px] text-[#646970]">
          Add your cPanel FTP details, save, then run Test connection. Uploads will use FTP when connected.
        </p>
      </div>
    </div>
  );
}

export function FtpMediaSettingsPanel({
  settings,
  revision,
}: {
  settings: AdminSettingsView;
  revision: string;
}) {
  const [saveState, saveAction, savePending] = useActionState(saveFtpSettingsAction, undefined);
  const [testState, testAction, testPending] = useActionState(testFtpSettingsAction, undefined);
  const [disconnectState, disconnectAction, disconnectPending] = useActionState(
    disconnectFtpSettingsAction,
    undefined,
  );

  useAdminActionFeedback(saveState, savePending, { loadingMessage: "Saving FTP settings…" });
  useAdminActionFeedback(testState, testPending, { loadingMessage: "Testing FTP connection…" });
  useAdminActionFeedback(disconnectState, disconnectPending, {
    loadingMessage: "Disconnecting FTP…",
  });

  const ftp = settings.ftp;

  return (
    <AdminWidget title="Media storage (FTP / cPanel)">
      <p className="admin-field-hint mt-0">
        Connect your hosting FTP account so tour, blog, and team images upload to cPanel. When connected,
        FTP is used first; otherwise the app falls back to Vercel Blob or local storage.
      </p>

      <div className="mt-4 space-y-4">
        <StatusBanner settings={ftp} />

        <div className="grid gap-3 sm:grid-cols-3">
          <div className="rounded-xl border border-[#dcdcde] bg-white px-3 py-3">
            <div className="flex items-center gap-2 text-[#646970]">
              <HiServerStack className="h-4 w-4" aria-hidden />
              <span className="text-[11px] font-semibold uppercase tracking-wide">Host</span>
            </div>
            <p className="mt-1 truncate text-[13px] font-medium text-[#1d2327]">
              {ftp.host || "—"}
            </p>
          </div>
          <div className="rounded-xl border border-[#dcdcde] bg-white px-3 py-3">
            <div className="flex items-center gap-2 text-[#646970]">
              <HiFolderOpen className="h-4 w-4" aria-hidden />
              <span className="text-[11px] font-semibold uppercase tracking-wide">Folder</span>
            </div>
            <p className="mt-1 truncate text-[13px] font-medium text-[#1d2327]">
              {ftp.remoteFolder || "media"}
            </p>
          </div>
          <div className="rounded-xl border border-[#dcdcde] bg-white px-3 py-3">
            <div className="flex items-center gap-2 text-[#646970]">
              <HiCloudArrowUp className="h-4 w-4" aria-hidden />
              <span className="text-[11px] font-semibold uppercase tracking-wide">Uploads</span>
            </div>
            <p className="mt-1 text-[13px] font-medium text-[#1d2327]">
              {settings.status.ftpReady ? "FTP primary" : "Fallback mode"}
            </p>
          </div>
        </div>

        <form key={`ftp-${revision}`} action={saveAction} className="space-y-4">
          <Toggle
            id="ftp-enabled"
            name="enabled"
            label="Use FTP for image uploads"
            description="When enabled and tested, new uploads go to this cPanel folder first."
            defaultChecked={ftp.enabled}
          />

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="ftp-host" className="admin-label">
                FTP host
              </label>
              <input
                id="ftp-host"
                name="host"
                type="text"
                required
                defaultValue={ftp.host}
                placeholder="ftp.yourdomain.com"
                className="admin-input"
                autoComplete="off"
              />
            </div>
            <div>
              <label htmlFor="ftp-port" className="admin-label">
                Port
              </label>
              <input
                id="ftp-port"
                name="port"
                type="number"
                min={1}
                max={65535}
                defaultValue={ftp.port || 21}
                className="admin-input"
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="ftp-username" className="admin-label">
                Username
              </label>
              <input
                id="ftp-username"
                name="username"
                type="text"
                required
                defaultValue={ftp.username}
                className="admin-input"
                autoComplete="off"
              />
            </div>
            <div>
              <label htmlFor="ftp-password" className="admin-label">
                Password
              </label>
              <input
                id="ftp-password"
                name="password"
                type="password"
                placeholder={ftp.hasPassword ? "•••••••• (leave blank to keep)" : "FTP password"}
                className="admin-input"
                autoComplete="new-password"
              />
            </div>
          </div>

          <Toggle
            id="ftp-secure"
            name="secure"
            label="Use FTPS (TLS)"
            description="Recommended for cPanel. Turn off only if your host requires plain FTP."
            defaultChecked={ftp.secure}
          />

          <div>
            <label htmlFor="ftp-remote-folder" className="admin-label">
              Remote images folder
            </label>
            <input
              id="ftp-remote-folder"
              name="remoteFolder"
              type="text"
              defaultValue={ftp.remoteFolder || "media"}
              placeholder="media"
              className="admin-input"
            />
            <p className="admin-field-hint">
              Path relative to your FTP home. Most cPanel accounts already start in
              public_html — use <code className="rounded bg-[#f3efe8] px-1">media</code>,
              not <code className="rounded bg-[#f3efe8] px-1">public_html/media</code>.
              Test connection creates the folder if missing.
            </p>
          </div>

          <div>
            <label htmlFor="ftp-public-base" className="admin-label">
              Public base URL
            </label>
            <div className="relative">
              <HiLink
                className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#8c8f94]"
                aria-hidden
              />
              <input
                id="ftp-public-base"
                name="publicBaseUrl"
                type="url"
                required
                defaultValue={ftp.publicBaseUrl}
                placeholder="https://www.travelzonegh.org/media"
                className="admin-input pl-9"
              />
            </div>
            <p className="admin-field-hint">
              Use your site URL ending in /media (e.g. https://www.travelzonegh.org/media).
              Files stay on cPanel via FTP; the Next.js site serves them at /media/… so
              previews work on Vercel.
            </p>
          </div>

          {saveState && !saveState.success ? (
            <AdminNotice variant="error">{saveState.error}</AdminNotice>
          ) : null}
          {saveState?.success ? (
            <AdminNotice variant="success">{saveState.message}</AdminNotice>
          ) : null}

          <div className="admin-settings-form-footer flex flex-wrap gap-2">
            <button
              type="submit"
              disabled={savePending}
              className="admin-login-submit sm:w-auto"
            >
              {savePending ? "Saving…" : "Save FTP settings"}
            </button>
          </div>
        </form>

        <div className="flex flex-wrap gap-2 border-t border-[#dcdcde] pt-4">
          <form action={testAction}>
            <button
              type="submit"
              disabled={testPending || !ftp.hasPassword}
              className="admin-button-secondary"
            >
              {testPending ? "Testing…" : "Test connection"}
            </button>
          </form>
          <form action={disconnectAction}>
            <button
              type="submit"
              disabled={disconnectPending || (!ftp.hasPassword && !ftp.enabled)}
              className="admin-button-secondary"
            >
              {disconnectPending ? "Disconnecting…" : "Disconnect"}
            </button>
          </form>
        </div>

        {testState && !testState.success ? (
          <AdminNotice variant="error">{testState.error}</AdminNotice>
        ) : null}
        {testState?.success ? (
          <AdminNotice variant="success">{testState.message}</AdminNotice>
        ) : null}
        {disconnectState?.success ? (
          <AdminNotice variant="success">{disconnectState.message}</AdminNotice>
        ) : null}
        {!ftp.hasPassword ? (
          <p className="admin-field-hint">
            Save a password before running Test connection.
          </p>
        ) : null}
      </div>
    </AdminWidget>
  );
}
