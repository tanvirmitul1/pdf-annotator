import Link from "next/link"

import { LogoMark } from "@/components/common/logo-mark"

export const metadata = {
  title: "Data Deletion – Clustar",
  description: "How to request deletion of your Clustar data associated with Facebook Login.",
}

export default function DataDeletionPage() {
  return (
    <main
      id="main-content"
      className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-background px-4 py-16"
    >
      {/* Background blobs — same as AuthShell */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
        <div
          className="absolute -right-[8%] -top-[12%] h-[85vh] w-[72vw] blur-3xl"
          style={{
            background:
              "radial-gradient(ellipse at 68% 18%, var(--blob-fill-a) 0%, var(--blob-fill-b) 40%, transparent 68%)",
          }}
        />
        <div
          className="absolute -bottom-[12%] -left-[6%] h-[62vh] w-[58vw] blur-3xl"
          style={{
            background:
              "radial-gradient(ellipse at 28% 72%, var(--blob-fill-c) 0%, var(--blob-fill-d) 38%, transparent 65%)",
          }}
        />
      </div>

      {/* Navbar */}
      <nav className="absolute inset-x-0 top-0 z-20 flex items-center justify-between border-b border-border/40 bg-background/25 px-6 py-4 backdrop-blur-md sm:px-10">
        <Link href="/" className="flex items-center gap-2.5 focus-visible:outline-none">
          <LogoMark compact />
          <span className="text-lg font-semibold tracking-tight">Clustar</span>
        </Link>
        <Link
          href="/auth/login"
          className="text-sm font-semibold text-foreground transition-colors hover:text-primary"
        >
          Sign in
        </Link>
      </nav>

      {/* Card */}
      <div className="relative z-10 w-full max-w-[520px]">
        <div className="mb-6 flex justify-center">
          <div className="flex size-12 items-center justify-center rounded-xl border border-border/60 bg-card/80 shadow-sm backdrop-blur-sm">
            <LogoMark compact />
          </div>
        </div>

        <div className="overflow-hidden rounded-2xl border border-border/60 bg-card/80 shadow-2xl backdrop-blur-sm px-8 py-8 space-y-5">
          <div>
            <h1 className="text-xl font-bold text-foreground">Data Deletion Request</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              How to delete your Clustar data associated with Facebook Login.
            </p>
          </div>

          <hr className="border-border/40" />

          <section className="space-y-2">
            <h2 className="text-sm font-semibold text-foreground">What data Clustar stores</h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              When you sign in with Facebook, Clustar receives and stores your
              Facebook-provided <strong className="text-foreground">name</strong>,{" "}
              <strong className="text-foreground">email address</strong>, and{" "}
              <strong className="text-foreground">profile picture URL</strong>. We also
              store a record linking your Clustar account to your Facebook account ID so
              you can sign in again. No other Facebook data is accessed or retained.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-sm font-semibold text-foreground">How to delete your data</h2>
            <ol className="text-sm text-muted-foreground leading-relaxed list-decimal list-inside space-y-1.5">
              <li>
                Sign in to Clustar at{" "}
                <Link href="/auth/login" className="text-primary hover:underline underline-offset-2">
                  clustar.app/auth/login
                </Link>
                .
              </li>
              <li>
                Go to{" "}
                <Link href="/settings/profile" className="text-primary hover:underline underline-offset-2">
                  Settings → Profile
                </Link>{" "}
                and scroll to the <strong className="text-foreground">Danger Zone</strong> section.
              </li>
              <li>
                Click <strong className="text-foreground">Delete account</strong>. This permanently
                removes your profile, documents, annotations, and all associated data including the
                Facebook account link.
              </li>
            </ol>
          </section>

          <section className="space-y-2">
            <h2 className="text-sm font-semibold text-foreground">Need help?</h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              If you cannot access your account or need assistance, email us at{" "}
              <a
                href="mailto:privacy@clustar.app"
                className="text-primary hover:underline underline-offset-2"
              >
                privacy@clustar.app
              </a>{" "}
              with the subject line <em>&ldquo;Data Deletion Request&rdquo;</em>. We will process your
              request within 30 days and confirm deletion by email.
            </p>
          </section>

          <hr className="border-border/40" />

          <p className="text-xs text-muted-foreground/70 leading-relaxed">
            For more information, see our{" "}
            <Link href="/privacy" className="underline underline-offset-2 hover:text-foreground transition-colors">
              Privacy Policy
            </Link>
            .
          </p>
        </div>
      </div>
    </main>
  )
}
