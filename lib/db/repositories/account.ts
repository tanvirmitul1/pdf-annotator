import { randomUUID } from "node:crypto"

import {
  getMockDb,
  type AnalyticsEventRecord,
  type AuditLogRecord,
  type EmailLogRecord,
  type EmailTemplateName,
  type ExportJobRecord,
  type PlanMetric,
  type SessionRecord,
  type UsageRecord,
  type UserRecord,
} from "@/lib/db/mock-db"

function nowIso() {
  return new Date().toISOString()
}

function cloneUser(user: UserRecord) {
  return { ...user, providers: [...user.providers] }
}

export function accountRepository() {
  const db = getMockDb()

  return {
    getUserById(userId: string) {
      const user = db.users.find((entry) => entry.id === userId)
      return user ? cloneUser(user) : null
    },
    getUserByEmail(email: string) {
      const user = db.users.find((entry) => entry.email.toLowerCase() === email.toLowerCase())
      return user ? cloneUser(user) : null
    },
    listUsers() {
      return db.users.map(cloneUser)
    },
    createUser(input: {
      email: string
      displayName: string
      passwordHash: string | null
      providers: UserRecord["providers"]
      emailVerified: boolean
      googlePhotoUrl?: string | null
    }) {
      const timestamp = nowIso()
      const user: UserRecord = {
        id: randomUUID(),
        email: input.email,
        displayName: input.displayName,
        avatarUrl: null,
        googlePhotoUrl: input.googlePhotoUrl ?? null,
        passwordHash: input.passwordHash,
        providers: [...input.providers],
        planId: "free",
        emailVerified: input.emailVerified,
        deletedAt: null,
        createdAt: timestamp,
        updatedAt: timestamp,
      }

      db.users.push(user)

      for (const metric of ["documents", "storageMB", "shareLinks"] as const) {
        db.usage.push({
          id: randomUUID(),
          userId: user.id,
          metric,
          value: 0,
          periodStart: timestamp,
        })
      }

      return cloneUser(user)
    },
    updateUser(userId: string, updates: Partial<UserRecord>) {
      const user = db.users.find((entry) => entry.id === userId)
      if (!user) {
        return null
      }

      Object.assign(user, updates, { updatedAt: nowIso() })
      return cloneUser(user)
    },
    createSession(input: {
      userId: string
      userAgent: string
      ipAddress: string
      label: string
    }) {
      const timestamp = nowIso()
      const session: SessionRecord = {
        id: randomUUID(),
        userId: input.userId,
        userAgent: input.userAgent,
        ipAddress: input.ipAddress,
        label: input.label,
        createdAt: timestamp,
        lastActivityAt: timestamp,
        revokedAt: null,
      }

      db.sessions.push(session)
      return { ...session }
    },
    getSessionById(sessionId: string) {
      const session = db.sessions.find((entry) => entry.id === sessionId)
      return session ? { ...session } : null
    },
    touchSession(sessionId: string) {
      const session = db.sessions.find((entry) => entry.id === sessionId)
      if (!session || session.revokedAt) {
        return null
      }

      session.lastActivityAt = nowIso()
      return { ...session }
    },
    listSessionsForUser(userId: string) {
      return db.sessions
        .filter((entry) => entry.userId === userId && !entry.revokedAt)
        .map((entry) => ({ ...entry }))
        .sort((left, right) => right.lastActivityAt.localeCompare(left.lastActivityAt))
    },
    revokeSession(userId: string, sessionId: string) {
      const session = db.sessions.find(
        (entry) => entry.id === sessionId && entry.userId === userId && !entry.revokedAt
      )
      if (!session) {
        return null
      }

      session.revokedAt = nowIso()
      return { ...session }
    },
    revokeOtherSessions(userId: string, currentSessionId: string) {
      const revokedAt = nowIso()
      let revokedCount = 0

      for (const session of db.sessions) {
        if (session.userId === userId && session.id !== currentSessionId && !session.revokedAt) {
          session.revokedAt = revokedAt
          revokedCount += 1
        }
      }

      return revokedCount
    },
    getPlanById(planId: string) {
      return db.plans.find((plan) => plan.id === planId) ?? null
    },
    getUsageForUser(userId: string) {
      return db.usage.filter((entry) => entry.userId === userId).map((entry) => ({ ...entry }))
    },
    upsertUsage(userId: string, metric: PlanMetric, value: number) {
      const existing = db.usage.find((entry) => entry.userId === userId && entry.metric === metric)
      if (existing) {
        existing.value = value
        return { ...existing }
      }

      const usage: UsageRecord = {
        id: randomUUID(),
        userId,
        metric,
        value,
        periodStart: nowIso(),
      }
      db.usage.push(usage)
      return { ...usage }
    },
    createAuditLog(input: Omit<AuditLogRecord, "id" | "createdAt">) {
      const log: AuditLogRecord = {
        id: randomUUID(),
        createdAt: nowIso(),
        ...input,
      }

      db.auditLogs.push(log)
      return { ...log }
    },
    createEmailLog(input: {
      userId: string | null
      template: EmailTemplateName
      to: string
      subject: string
      html: string
      status: EmailLogRecord["status"]
      provider: EmailLogRecord["provider"]
      providerId?: string | null
      error?: string | null
    }) {
      const timestamp = nowIso()
      const log: EmailLogRecord = {
        id: randomUUID(),
        userId: input.userId,
        template: input.template,
        to: input.to,
        subject: input.subject,
        html: input.html,
        status: input.status,
        provider: input.provider,
        providerId: input.providerId ?? null,
        error: input.error ?? null,
        createdAt: timestamp,
        updatedAt: timestamp,
      }

      db.emailLogs.push(log)
      return { ...log }
    },
    updateEmailLog(emailLogId: string, updates: Partial<EmailLogRecord>) {
      const emailLog = db.emailLogs.find((entry) => entry.id === emailLogId)
      if (!emailLog) {
        return null
      }

      Object.assign(emailLog, updates, { updatedAt: nowIso() })
      return { ...emailLog }
    },
    listEmailLogsForUser(userId: string) {
      return db.emailLogs.filter((entry) => entry.userId === userId).map((entry) => ({ ...entry }))
    },
    createExportJob(userId: string) {
      const timestamp = nowIso()
      const job: ExportJobRecord = {
        id: randomUUID(),
        userId,
        kind: "data-export",
        status: "queued",
        progress: 0,
        resultUrl: null,
        error: null,
        createdAt: timestamp,
        updatedAt: timestamp,
      }

      db.exportJobs.push(job)
      return { ...job }
    },
    updateExportJob(userId: string, jobId: string, updates: Partial<ExportJobRecord>) {
      const job = db.exportJobs.find(
        (entry) => entry.id === jobId && entry.userId === userId
      )
      if (!job) {
        return null
      }

      Object.assign(job, updates, { updatedAt: nowIso() })
      return { ...job }
    },
    getLatestExportJob(userId: string) {
      const jobs = db.exportJobs
        .filter((entry) => entry.userId === userId)
        .sort((left, right) => right.createdAt.localeCompare(left.createdAt))
      return jobs[0] ? { ...jobs[0] } : null
    },
    createAnalyticsEvent(input: Omit<AnalyticsEventRecord, "id" | "createdAt">) {
      const event: AnalyticsEventRecord = {
        id: randomUUID(),
        createdAt: nowIso(),
        ...input,
      }

      db.analyticsEvents.push(event)
      return { ...event }
    },
    listAnalyticsEvents() {
      return db.analyticsEvents.map((entry) => ({ ...entry }))
    },
  }
}
