import { LegalPage } from "@/components/common/legal-page"

export default function CookiesPage() {
  return (
    <LegalPage
      eyebrow="Cookie policy"
      title="Cookie Policy"
      description="A clear split between essential functionality and optional analytics helps the product feel trustworthy before deeper product features arrive."
      sections={[
        {
          title: "Essential cookies",
          body: (
            <>
              <p>
                Essential cookies keep authentication, route protection, and
                user-selected theme preferences working correctly. These are
                required for the core product to function.
              </p>
            </>
          ),
        },
        {
          title: "Analytics cookies",
          body: (
            <>
              <p>
                Non-essential analytics cookies remain blocked until the user
                explicitly accepts them. Rejecting analytics keeps the app in
                essential-only mode.
              </p>
            </>
          ),
        },
        {
          title: "Managing your choice",
          body: (
            <>
              <p>
                Users can revisit the analytics choice through the cookie banner
                flow or by clearing stored cookies and returning to the site.
                TODO: lawyer review.
              </p>
            </>
          ),
        },
      ]}
    />
  )
}
