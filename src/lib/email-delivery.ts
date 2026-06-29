import nodemailer from "nodemailer";
import { Resend } from "resend";
import type { ResendSettings, SmtpSettings } from "@/lib/settings-types";

export type EmailDeliveryConfig =
  | { provider: "resend"; config: ResendSettings }
  | { provider: "smtp"; config: SmtpSettings };

export type SendEmailParams = {
  to: string | string[];
  subject: string;
  text: string;
  html?: string;
};

function normalizeRecipients(to: string | string[]) {
  return (Array.isArray(to) ? to : [to]).map((value) => value.trim()).filter(Boolean);
}

function formatFromAddress(fromName: string, fromEmail: string) {
  return `"${fromName.replace(/"/g, "")}" <${fromEmail}>`;
}

export function formatEmailDeliveryError(error: unknown) {
  const message = error instanceof Error ? error.message : String(error);
  const code =
    error && typeof error === "object" && "code" in error
      ? String((error as { code?: string }).code)
      : "";

  if (
    code === "ETIMEDOUT" ||
    code === "ECONNREFUSED" ||
    code === "ESOCKET" ||
    message.includes("Timeout") ||
    message.includes("timeout")
  ) {
    const onRender = process.env.RENDER === "true";
    if (onRender) {
      return (
        "SMTP connection timed out. Render free web services block outbound ports 25, 465, and 587. " +
        "Enable Resend under Admin → Settings → Email, upgrade to a paid Render instance, or test SMTP locally."
      );
    }
    return (
      "SMTP connection failed. Check host, port, SSL/TLS, username, and app password. " +
      "For Gmail/Yahoo, use an app password — not your normal login password."
    );
  }

  if (message.includes("Invalid login") || message.includes("Authentication")) {
    return "SMTP authentication failed. Check username and password (use an app password for Gmail/Yahoo).";
  }

  return message || "Email delivery failed.";
}

async function sendViaResend(config: ResendSettings, params: SendEmailParams) {
  const recipients = normalizeRecipients(params.to);
  if (recipients.length === 0) {
    throw new Error("No recipient email address provided.");
  }

  const resend = new Resend(config.apiKey);
  const { error } = await resend.emails.send({
    from: formatFromAddress(config.fromName, config.fromEmail),
    to: recipients,
    subject: params.subject,
    text: params.text,
    html: params.html ?? params.text.replace(/\n/g, "<br>"),
  });

  if (error) {
    throw new Error(error.message);
  }
}

async function sendViaSmtp(config: SmtpSettings, params: SendEmailParams) {
  const port = config.port || 587;
  const secure = config.secure || port === 465;

  if (config.user.trim() && !config.password.trim()) {
    throw new Error("SMTP password is missing. Save your SMTP password in Admin → Settings → Email.");
  }

  const transporter = nodemailer.createTransport({
    host: config.host,
    port,
    secure,
    requireTLS: !secure && port === 587,
    auth: config.user.trim()
      ? { user: config.user.trim(), pass: config.password }
      : undefined,
    connectionTimeout: 15_000,
    greetingTimeout: 15_000,
    socketTimeout: 20_000,
  });

  await transporter.sendMail({
    from: formatFromAddress(config.fromName, config.fromEmail),
    to: normalizeRecipients(params.to).join(", "),
    subject: params.subject,
    text: params.text,
    html: params.html ?? params.text.replace(/\n/g, "<br>"),
  });
}

export async function deliverEmail(
  delivery: EmailDeliveryConfig,
  params: SendEmailParams,
) {
  if (delivery.provider === "resend") {
    await sendViaResend(delivery.config, params);
    return;
  }

  await sendViaSmtp(delivery.config, params);
}
