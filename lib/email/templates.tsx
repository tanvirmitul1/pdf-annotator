import * as React from "react"
import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Preview,
  Section,
  Text,
} from "@react-email/components"
import { render } from "@react-email/render"

import { type EmailTemplateName } from "@/lib/db/mock-db"

type TemplateProps = {
  name: string
  actionUrl?: string
  actionLabel?: string
  email?: string
}

function EmailShell({
  preview,
  heading,
  children,
  actionUrl,
  actionLabel,
}: React.PropsWithChildren<{
  preview: string
  heading: string
  actionUrl?: string
  actionLabel?: string
}>) {
  return (
    <Html lang="en">
      <Head />
      <Preview>{preview}</Preview>
      <Body
        style={{
          backgroundColor: "#0f172a",
          color: "#e2e8f0",
          fontFamily:
            "Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, sans-serif",
          margin: "0",
          padding: "32px 12px",
        }}
      >
        <Container
          style={{
            backgroundColor: "#111827",
            border: "1px solid #334155",
            borderRadius: "18px",
            margin: "0 auto",
            maxWidth: "560px",
            overflow: "hidden",
            padding: "32px",
          }}
        >
          <Section>
            <Text style={{ color: "#93c5fd", fontSize: "12px", letterSpacing: "0.08em", textTransform: "uppercase" }}>
              PDF Annotator
            </Text>
            <Heading style={{ color: "#f8fafc", fontSize: "28px", marginBottom: "12px" }}>
              {heading}
            </Heading>
            <Text style={{ color: "#cbd5e1", fontSize: "15px", lineHeight: "24px" }}>
              {children}
            </Text>
          </Section>
          {actionUrl && actionLabel ? (
            <Section style={{ marginTop: "24px" }}>
              <Button
                href={actionUrl}
                style={{
                  backgroundColor: "#f8fafc",
                  borderRadius: "999px",
                  color: "#0f172a",
                  display: "inline-block",
                  fontSize: "14px",
                  fontWeight: 600,
                  padding: "14px 22px",
                  textDecoration: "none",
                }}
              >
                {actionLabel}
              </Button>
            </Section>
          ) : null}
          <Hr style={{ borderColor: "#334155", margin: "28px 0" }} />
          <Text style={{ color: "#94a3b8", fontSize: "12px", lineHeight: "20px" }}>
            You received this because your account activity triggered a transactional email.
          </Text>
        </Container>
      </Body>
    </Html>
  )
}

function WelcomeTemplate({ name, actionUrl }: TemplateProps) {
  return (
    <EmailShell
      preview="Welcome to PDF Annotator"
      heading={`Welcome aboard, ${name}.`}
      actionUrl={actionUrl}
      actionLabel="Open your library"
    >
      Your account is ready. Start by uploading a study document, organizing it into collections,
      and adding notes that stay easy to revisit later.
    </EmailShell>
  )
}

function EmailVerificationTemplate({ name, actionUrl }: TemplateProps) {
  return (
    <EmailShell
      preview="Verify your email"
      heading={`Verify your email, ${name}.`}
      actionUrl={actionUrl}
      actionLabel="Verify email"
    >
      Confirm this address so we can protect your account and send the essential updates you asked
      for.
    </EmailShell>
  )
}

function PasswordResetTemplate({ name, actionUrl }: TemplateProps) {
  return (
    <EmailShell
      preview="Reset your password"
      heading={`Reset your password, ${name}.`}
      actionUrl={actionUrl}
      actionLabel="Reset password"
    >
      A password reset was requested for your account. If that was you, use the button below to set
      a new password. If not, you can ignore this email.
    </EmailShell>
  )
}

function AccountDeletionTemplate({ name, actionUrl }: TemplateProps) {
  return (
    <EmailShell
      preview="Your account is scheduled for deletion"
      heading={`Your account is in its grace period, ${name}.`}
      actionUrl={actionUrl}
      actionLabel="Restore my account"
    >
      We scheduled your account for deletion. You can restore everything within the next 7 days
      before the deletion becomes permanent.
    </EmailShell>
  )
}

function DataExportTemplate({ name, actionUrl }: TemplateProps) {
  return (
    <EmailShell
      preview="Your data export is ready"
      heading={`Your export is ready, ${name}.`}
      actionUrl={actionUrl}
      actionLabel="Download export"
    >
      Your account export has finished processing. The secure link below is temporary, so download
      it when you are ready.
    </EmailShell>
  )
}

export function getEmailSubject(template: EmailTemplateName) {
  switch (template) {
    case "welcome":
      return "Welcome to PDF Annotator"
    case "email-verification":
      return "Verify your email address"
    case "password-reset":
      return "Reset your PDF Annotator password"
    case "account-deletion-confirmation":
      return "Your account is scheduled for deletion"
    case "data-export-ready":
      return "Your PDF Annotator export is ready"
  }
}

export async function renderEmailTemplate(template: EmailTemplateName, props: TemplateProps) {
  const componentMap: Record<EmailTemplateName, React.ReactElement> = {
    welcome: <WelcomeTemplate {...props} />,
    "email-verification": <EmailVerificationTemplate {...props} />,
    "password-reset": <PasswordResetTemplate {...props} />,
    "account-deletion-confirmation": <AccountDeletionTemplate {...props} />,
    "data-export-ready": <DataExportTemplate {...props} />,
  }

  return render(componentMap[template])
}
