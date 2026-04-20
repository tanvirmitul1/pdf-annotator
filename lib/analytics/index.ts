import { accountRepository } from "@/lib/db/repositories/account"
import { type AnalyticsEvent } from "@/lib/analytics/events"

export function track<E extends AnalyticsEvent["name"]>(
  userId: string | null,
  name: E,
  props: Extract<AnalyticsEvent, { name: E }>["props"]
) {
  const repository = accountRepository()
  repository.createAnalyticsEvent({
    userId,
    name,
    props: props as Record<string, unknown>,
  })
}
