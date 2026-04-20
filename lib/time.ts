export function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value))
}

export function formatRelativeDays(value: string) {
  const target = new Date(value)
  const today = new Date()
  const diff = Math.round((target.getTime() - today.getTime()) / 86_400_000)

  if (diff === 0) {
    return "today"
  }

  if (diff > 0) {
    return `in ${diff} day${diff === 1 ? "" : "s"}`
  }

  const abs = Math.abs(diff)
  return `${abs} day${abs === 1 ? "" : "s"} ago`
}

export function differenceInCalendarDays(left: Date, right: Date) {
  const leftDate = new Date(left.getFullYear(), left.getMonth(), left.getDate())
  const rightDate = new Date(right.getFullYear(), right.getMonth(), right.getDate())
  return Math.round((leftDate.getTime() - rightDate.getTime()) / 86_400_000)
}

export function addDays(date: Date, amount: number) {
  const clone = new Date(date)
  clone.setDate(clone.getDate() + amount)
  return clone
}
