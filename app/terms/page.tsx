import { LegalPage } from "@/components/common/legal-page"

export default function TermsPage() {
  return (
    <LegalPage
      eyebrow="Terms of service"
      title="Terms of Service"
      description="This is a structured legal draft with clear placeholders for counsel review, so the app can look credible now without pretending unfinished legal work is complete."
      sections={[
        {
          title: "Acceptance and eligibility",
          body: (
            <>
              <p>
                TODO: lawyer review. Placeholder language should explain
                acceptance of the agreement, age and eligibility requirements,
                permitted jurisdictions, and the basic scope of the service.
              </p>
            </>
          ),
        },
        {
          title: "Account responsibilities",
          body: (
            <>
              <p>
                TODO: lawyer review. This section should cover credential
                security, accurate account information, prohibited
                impersonation, and the obligation to use the service lawfully.
              </p>
            </>
          ),
        },
        {
          title: "User content and service behavior",
          body: (
            <>
              <p>
                TODO: lawyer review. This section should define ownership of
                uploaded documents, annotations, and derived metadata, plus
                acceptable use boundaries and retention behavior.
              </p>
            </>
          ),
        },
        {
          title: "Changes, suspension, and deletion",
          body: (
            <>
              <p>
                TODO: lawyer review. Placeholder language should explain plan
                changes, service interruptions, account suspension for abuse,
                and the 7-day deletion grace period.
              </p>
            </>
          ),
        },
        {
          title: "Liability, governing law, and disputes",
          body: (
            <>
              <p>
                TODO: lawyer review. Include limitation of liability, warranty
                disclaimers, dispute resolution terms, and the governing law /
                venue details appropriate for launch.
              </p>
            </>
          ),
        },
      ]}
    />
  )
}
