import { randomUUID } from "node:crypto"

import { hashPassword } from "@/lib/auth/password"

export type AccountProvider = "credentials" | "google"
export type PlanMetric = "documents" | "storageMB" | "shareLinks"
export type EmailTemplateName =
  | "welcome"
  | "email-verification"
  | "password-reset"
  | "account-deletion-confirmation"
  | "data-export-ready"

export interface UserRecord {
  id: string
  email: string
  displayName: string
  avatarUrl: string | null
  googlePhotoUrl: string | null
  passwordHash: string | null
  providers: AccountProvider[]
  planId: string
  emailVerified: boolean
  deletedAt: string | null
  createdAt: string
  updatedAt: string
}

export interface SessionRecord {
  id: string
  userId: string
  userAgent: string
  ipAddress: string
  label: string
  createdAt: string
  lastActivityAt: string
  revokedAt: string | null
}

export interface PlanRecord {
  id: string
  name: string
  limits: Record<PlanMetric, number>
  allowedFeatures: string[]
}

export interface UsageRecord {
  id: string
  userId: string
  metric: PlanMetric
  value: number
  periodStart: string
}

export interface AuditLogRecord {
  id: string
  userId: string
  action: string
  resourceType: string
  resourceId: string
  metadata: Record<string, unknown>
  ipAddress: string
  createdAt: string
}

export interface EmailLogRecord {
  id: string
  userId: string | null
  template: EmailTemplateName
  to: string
  subject: string
  html: string
  status: "queued" | "sent" | "failed" | "skipped"
  provider: "resend" | "in-process"
  providerId: string | null
  error: string | null
  createdAt: string
  updatedAt: string
}

export interface ExportJobRecord {
  id: string
  userId: string
  kind: "data-export"
  status: "queued" | "processing" | "ready" | "failed"
  progress: number
  resultUrl: string | null
  error: string | null
  createdAt: string
  updatedAt: string
}

export interface AnalyticsEventRecord {
  id: string
  userId: string | null
  name: string
  props: Record<string, unknown>
  createdAt: string
}

export interface MockDbState {
  users: UserRecord[]
  sessions: SessionRecord[]
  plans: PlanRecord[]
  usage: UsageRecord[]
  auditLogs: AuditLogRecord[]
  emailLogs: EmailLogRecord[]
  exportJobs: ExportJobRecord[]
  analyticsEvents: AnalyticsEventRecord[]
}

declare global {
  var __pdfAnnotatorMockDb: MockDbState | undefined
}

function nowIso() {
  return new Date().toISOString()
}

function createInitialState(): MockDbState {
  const now = nowIso()
  const credentialsUserId = randomUUID()
  const googleUserId = randomUUID()

  return {
    plans: [
      {
        id: "free",
        name: "Free",
        limits: {
          documents: 10,
          storageMB: 500,
          shareLinks: 3,
        },
        allowedFeatures: ["data-export", "settings", "email"],
      },
    ],
    users: [
      {
        id: credentialsUserId,
        email: "demo@example.com",
        displayName: "Ari Demo",
        avatarUrl: null,
        googlePhotoUrl: null,
        passwordHash: hashPassword("Password123!"),
        providers: ["credentials"],
        planId: "free",
        emailVerified: true,
        deletedAt: null,
        createdAt: now,
        updatedAt: now,
      },
      {
        id: googleUserId,
        email: "google-user@example.com",
        displayName: "Mina Google",
        avatarUrl: null,
        googlePhotoUrl: "/google-avatar.svg",
        passwordHash: null,
        providers: ["google"],
        planId: "free",
        emailVerified: true,
        deletedAt: null,
        createdAt: now,
        updatedAt: now,
      },
    ],
    sessions: [],
    usage: [
      {
        id: randomUUID(),
        userId: credentialsUserId,
        metric: "documents",
        value: 0,
        periodStart: now,
      },
      {
        id: randomUUID(),
        userId: credentialsUserId,
        metric: "storageMB",
        value: 0,
        periodStart: now,
      },
      {
        id: randomUUID(),
        userId: credentialsUserId,
        metric: "shareLinks",
        value: 0,
        periodStart: now,
      },
      {
        id: randomUUID(),
        userId: googleUserId,
        metric: "documents",
        value: 3,
        periodStart: now,
      },
      {
        id: randomUUID(),
        userId: googleUserId,
        metric: "storageMB",
        value: 96,
        periodStart: now,
      },
      {
        id: randomUUID(),
        userId: googleUserId,
        metric: "shareLinks",
        value: 1,
        periodStart: now,
      },
    ],
    auditLogs: [],
    emailLogs: [],
    exportJobs: [],
    analyticsEvents: [],
  }
}

export function getMockDb(): MockDbState {
  if (!globalThis.__pdfAnnotatorMockDb) {
    globalThis.__pdfAnnotatorMockDb = createInitialState()
  }

  return globalThis.__pdfAnnotatorMockDb
}

export function resetMockDb() {
  globalThis.__pdfAnnotatorMockDb = createInitialState()
}
