import { accountRepository } from "@/lib/db/repositories/account"
import { FeatureGatedError, QuotaExceededError } from "@/lib/errors"

type AllowedAction = "document.create" | "share.create" | "export.run"

export async function assertCanPerform(
  userId: string,
  action: AllowedAction,
  context?: Record<string, unknown>
) {
  void context
  const repository = accountRepository()
  const user = repository.getUserById(userId)

  if (!user) {
    throw new FeatureGatedError("missing-user")
  }

  const plan = repository.getPlanById(user.planId)

  if (!plan) {
    throw new FeatureGatedError("missing-plan")
  }

  if (action === "export.run" && !plan.allowedFeatures.includes("data-export")) {
    throw new FeatureGatedError("data-export")
  }

  const usage = repository.getUsageForUser(userId)

  if (action === "document.create") {
    const documentsUsage = usage.find((entry) => entry.metric === "documents")?.value ?? 0
    if (documentsUsage >= plan.limits.documents) {
      throw new QuotaExceededError("documents", plan.limits.documents, documentsUsage)
    }
  }

  if (action === "share.create") {
    const shareUsage = usage.find((entry) => entry.metric === "shareLinks")?.value ?? 0
    if (shareUsage >= plan.limits.shareLinks) {
      throw new QuotaExceededError("shareLinks", plan.limits.shareLinks, shareUsage)
    }
  }
}
