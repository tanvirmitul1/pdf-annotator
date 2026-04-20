import { render } from "@testing-library/react"
import { axe } from "vitest-axe"
import { describe, expect, it } from "vitest"

import LoginPage from "@/app/login/page"
import PrivacyPage from "@/app/privacy/page"
import SignupPage from "@/app/signup/page"
import { SettingsView } from "@/components/settings/settings-view"

describe("accessibility smoke tests", () => {
  it("login page has no obvious accessibility violations", async () => {
    const { container } = render(<LoginPage />)
    expect((await axe(container)).violations).toHaveLength(0)
  })

  it("signup page has no obvious accessibility violations", async () => {
    const { container } = render(<SignupPage />)
    expect((await axe(container)).violations).toHaveLength(0)
  })

  it("settings page has no obvious accessibility violations", async () => {
    const { container } = render(
      <SettingsView
        snapshot={{
          user: {
            displayName: "Ari Demo",
            email: "demo@example.com",
            providers: ["credentials"],
            imageUrl: null,
            deletedAt: null,
          },
          currentSessionId: "session-current",
          plan: {
            name: "Free",
            limits: {
              documents: 10,
              storageMB: 500,
              shareLinks: 3,
            },
          },
          usage: [
            { metric: "documents", value: 1, limit: 10 },
            { metric: "storageMB", value: 60, limit: 500 },
            { metric: "shareLinks", value: 1, limit: 3 },
          ],
          sessions: [
            {
              id: "session-current",
              label: "Chrome on desktop",
              userAgent: "Chrome on desktop",
              lastActivityAt: new Date().toISOString(),
            },
          ],
          latestExportJob: null,
        }}
      />
    )

    const results = await axe(container)
    expect(results.violations).toHaveLength(0)
  })

  it("privacy page has no obvious accessibility violations", async () => {
    const { container } = render(<PrivacyPage />)
    expect((await axe(container)).violations).toHaveLength(0)
  })
})
