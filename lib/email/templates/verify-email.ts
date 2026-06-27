import { emailBase } from "./base"

export function verifyEmailTemplate({
  name,
  verifyUrl,
}: {
  name: string
  verifyUrl: string
}): string {
  return emailBase({
    title: "Verify your email address",
    previewText: `Hi ${name}, please verify your email address to activate your Clustar account.`,
    icon: "✉️",
    iconBg: "#eef2ff",
    iconColor: "#c7d2fe",
    heading: "Verify your email address",
    greeting: `Hi <strong style="color:#0f172a;">${name}</strong>, welcome to Clustar! We just need to confirm your email address to activate your account.`,
    body: `
      <p style="margin:0 0 20px;font-size:15px;color:#475569;line-height:1.7;">
        Click the button below and you'll be verified instantly. The whole thing takes less than a second.
      </p>
    `,
    ctaText: "Verify email address",
    ctaUrl: verifyUrl,
    notice: `
      ⏱ This link expires in <strong>24 hours</strong>.<br>
      If you didn't create a Clustar account, you can safely ignore this email — no account will be activated.
    `,
  })
}
