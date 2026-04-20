import { describe, expect, it } from "vitest"

import { getEmailSubject, renderEmailTemplate } from "@/lib/email/templates"

describe("email templates", () => {
  it("renders every email template without error", async () => {
    const templates = [
      "welcome",
      "email-verification",
      "password-reset",
      "account-deletion-confirmation",
      "data-export-ready",
    ] as const

    for (const template of templates) {
      const html = await renderEmailTemplate(template, {
        name: "Ari Demo",
        actionUrl: "https://example.com/action",
        email: "demo@example.com",
      })

      expect(html).toContain("<!DOCTYPE")
      expect(getEmailSubject(template)).toBeTruthy()
    }
  })
})
