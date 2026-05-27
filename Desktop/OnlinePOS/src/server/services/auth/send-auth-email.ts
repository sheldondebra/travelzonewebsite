type SendResult = { sent: boolean; dev?: boolean };

export async function sendPasswordResetEmail(
  to: string,
  resetUrl: string,
): Promise<SendResult> {
  const from =
    process.env.EMAIL_FROM ?? "Social Commerce <onboarding@resend.dev>";
  const subject = "Reset your password — Social Commerce";
  const html = `
    <p>You requested a password reset for Social Commerce.</p>
    <p><a href="${resetUrl}">Reset your password</a></p>
    <p>This link expires in 1 hour. If you did not request this, ignore this email.</p>
    <p style="color:#666;font-size:12px;">Tecunit Ghana</p>
  `;

  const apiKey = process.env.RESEND_API_KEY;
  if (apiKey) {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ from, to, subject, html }),
    });
    if (!res.ok) {
      const err = await res.text();
      console.error("[AUTH EMAIL] Resend failed:", err);
      throw new Error("Failed to send reset email");
    }
    return { sent: true };
  }

  console.log("\n[AUTH] Password reset email (dev — set RESEND_API_KEY to send mail)");
  console.log(`  To:   ${to}`);
  console.log(`  Link: ${resetUrl}\n`);
  return { sent: false, dev: true };
}
