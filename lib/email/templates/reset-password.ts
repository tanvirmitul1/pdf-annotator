import { emailBase } from "./base"

export function resetPasswordTemplate({
  name,
  resetUrl,
}: {
  name: string
  resetUrl: string
}): string {
  return emailBase({
    title: "Reset your password",
    previewText: `Hi ${name}, we received a request to reset your Clustar password.`,
    icon: "🔐",
    iconBg: "#fff7ed",
    iconColor: "#fed7aa",
    heading: "Reset your password",
    greeting: `Hi <strong style="color:#0f172a;">${name}</strong>, we received a request to reset the password for your Clustar account.`,
    body: `
      <p style="margin:0 0 20px;font-size:15px;color:#475569;line-height:1.7;">
        Click the button below to choose a new password. If you didn't request this, you can safely ignore this email — your current password will remain unchanged.
      </p>
    `,
    ctaText: "Reset password",
    ctaUrl: resetUrl,
    notice: `
      ⏱ This link expires in <strong>1 hour</strong> for your security.<br>
      🔒 If you didn't request a password reset, please <strong>ignore this email</strong>. Your account is safe.
    `,
  })
}
