import { UsageMetric } from "@prisma/client"

import { FeatureGatedError, QuotaExceededError } from "@/lib/errors"
import { getPlan, getUsage } from "@/lib/authz/plan"

type Action = "document.create" | "annotation.create" | "share.create" | "export.run"

export async function assertCanPerform(
  userId: string,
  action: Action,
  context: {
    currentAnnotationsPerDoc?: number
  } = {}
) {
  const plan = await getPlan(userId)

  if (action === "document.create") {
    const current = await getUsage(userId, UsageMetric.DOCUMENTS)
    if (current >= plan.maxDocuments) {
      throw new QuotaExceededError("documents", plan.maxDocuments, current)
    }
    return
  }

  if (action === "share.create") {
    const current = await getUsage(userId, UsageMetric.SHARE_LINKS)
    if (current >= plan.maxShareLinks) {
      throw new QuotaExceededError("shareLinks", plan.maxShareLinks, current)
    }
    return
  }

  if (action === "annotation.create") {
    const current = context.currentAnnotationsPerDoc ?? 0
    if (current >= plan.maxAnnotationsPerDoc) {
      throw new QuotaExceededError("annotations", plan.maxAnnotationsPerDoc, current)
    }
    return
  }

  if (action === "export.run" && !plan.allowedFeatures.includes("data-export")) {
    throw new FeatureGatedError("data-export")
  }
}
