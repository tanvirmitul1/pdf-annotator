import { LegalPage } from "@/components/common/legal-page"

export default function PrivacyPage() {
  return (
    <LegalPage
      eyebrow="Privacy policy"
      title="Privacy Policy"
      description="This draft is structured for real review. It covers account data, Google OAuth usage, cookies, analytics consent, operational monitoring, retention, deletion, and user rights."
      sections={[
        {
          title: "What we collect",
          body: (
            <>
              <p>
                We collect the account information you provide directly,
                including your display name, email address, chosen
                authentication method, and the usage metadata needed to keep the
                app secure and quota-aware.
              </p>
              <p>
                If you sign in with Google OAuth, we use the verified email
                address, your name, and your Google profile photo to create and
                maintain your account. We do not request broader Google Drive or
                Gmail scopes for this experience.
              </p>
            </>
          ),
        },
        {
          title: "Cookies, consent, and analytics",
          body: (
            <>
              <p>
                Essential cookies keep sign-in, route protection, and theme
                preference working. Non-essential analytics stays blocked until
                you explicitly accept it through the cookie banner.
              </p>
              <p>
                Rejecting optional analytics leaves the core application usable.
                Consent preferences can be revisited through the cookie policy
                flow or by clearing the stored cookie.
              </p>
            </>
          ),
        },
        {
          title: "Operational monitoring and product telemetry",
          body: (
            <>
              <p>
                We use PostHog for product analytics after consent and Sentry
                for operational error tracking. Error tracking helps us
                investigate failures, while analytics helps us improve workflows
                and understand feature usage.
              </p>
              <p>
                Sensitive document content, annotation text, and private file
                names should not be sent in analytics payloads. Error payloads
                must be minimized and handled under the security and backend
                rules of the project.
              </p>
            </>
          ),
        },
        {
          title: "Retention, export, deletion, and restore",
          body: (
            <>
              <p>
                Users can request an export of their account data from Settings.
                Account deletion enters a 7-day grace period before permanent
                removal, and users may restore access during that window.
              </p>
              <p>
                Audit records may be retained in limited or anonymized form to
                preserve platform integrity, investigate abuse, and satisfy
                legal obligations where required.
              </p>
            </>
          ),
        },
        {
          title: "User rights and legal review",
          body: (
            <>
              <p>
                TODO: lawyer review. This section should describe lawful bases,
                regional rights under frameworks such as GDPR and CCPA,
                cross-border data transfer language, and formal complaint
                channels.
              </p>
              <p>
                Placeholder contact for the Data Protection Officer:{" "}
                <strong>privacy@example.com</strong>.
              </p>
            </>
          ),
        },
      ]}
    />
  )
}
