export default function PrivacyPage() {
  return (
    <main id="main-content" className="mx-auto max-w-4xl px-6 py-12">
      <div className="rounded-[2rem] border border-border bg-card/80 p-8 shadow-sm">
        <p className="text-sm font-semibold uppercase tracking-[0.24em] text-primary">Privacy Policy</p>
        <h1 className="mt-4 text-4xl font-semibold tracking-tight">Privacy Policy</h1>
        <div className="mt-8 space-y-8 text-sm/7 text-muted-foreground">
          <section>
            <h2 className="text-lg font-semibold text-foreground">1. What we collect</h2>
            <p className="mt-2">
              We collect the account information you provide directly, including your email address,
              display name, and your authentication method. If you sign in with Google OAuth, we use
              the verified email address and basic profile information supplied by Google to create
              your account.
            </p>
          </section>
          <section>
            <h2 className="text-lg font-semibold text-foreground">2. Cookies and consent</h2>
            <p className="mt-2">
              Essential cookies keep sign-in and account management working. Analytics cookies remain
              disabled until you explicitly accept them through the cookie banner. Rejecting optional
              analytics leaves the core account experience available.
            </p>
          </section>
          <section>
            <h2 className="text-lg font-semibold text-foreground">3. Analytics and error tracking</h2>
            <p className="mt-2">
              We plan to use PostHog for product analytics and Sentry for error tracking. Analytics
              is treated as non-essential, while operational error monitoring helps us diagnose service
              failures. Do not place personal note content or document titles inside analytics props.
            </p>
          </section>
          <section>
            <h2 className="text-lg font-semibold text-foreground">4. Data retention and user rights</h2>
            <p className="mt-2">
              You can request a data export from Settings. Account deletion enters a 7-day grace
              period before permanent purge. During that window you may restore the account. Audit
              records may be retained in anonymized form to preserve platform integrity.
            </p>
          </section>
          <section>
            <h2 className="text-lg font-semibold text-foreground">5. International rights and review</h2>
            <p className="mt-2">
              TODO: Lawyer review. Describe lawful bases, cross-border processing, GDPR/CCPA rights,
              and the data protection officer contact. Placeholder DPO contact: privacy@example.com.
            </p>
          </section>
        </div>
      </div>
    </main>
  )
}
