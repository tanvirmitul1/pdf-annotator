import Link from "next/link"

import { Button } from "@/components/ui/button"

export default function UpgradePlaceholderPage() {
  return (
    <main className="space-y-6">
      <div>
        <p className="text-sm font-semibold uppercase tracking-[0.24em] text-primary">Upgrade</p>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight">Billing placeholder</h1>
        <p className="mt-3 max-w-2xl text-sm/6 text-muted-foreground">
          Stripe arrives in a later phase. For now, this placeholder makes the quota UI and upgrade
          CTA concrete without pretending billing is already wired.
        </p>
      </div>
      <Button asChild className="hover:bg-primary/90">
        <Link href="/app/settings">Back to settings</Link>
      </Button>
    </main>
  )
}
