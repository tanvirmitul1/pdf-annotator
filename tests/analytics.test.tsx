import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, expect, it } from "vitest"

import { AnalyticsBridge } from "@/components/app/analytics-bridge"
import { CookieBanner } from "@/components/app/cookie-banner"

describe("analytics consent", () => {
  it("keeps analytics disabled until consent is accepted", async () => {
    render(
      <>
        <AnalyticsBridge consent="unknown" />
        <CookieBanner initialConsent="unknown" />
      </>
    )

    expect(screen.getByTestId("analytics-disabled")).toBeInTheDocument()
    expect(document.cookie).not.toContain("pdf-annotator-analytics=accepted")

    await userEvent.click(screen.getByRole("button", { name: "Accept analytics" }))

    expect(document.cookie).toContain("pdf-annotator-analytics=accepted")
  })
})
