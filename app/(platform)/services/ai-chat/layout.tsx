import { redirect } from "next/navigation"
import { requireAppUser } from "@/lib/auth/require"
import { AIChatLayoutClient } from "@/components/platform/ai-chat-layout-client"

export const metadata = {
  title: "AI Chat Assistant - Clustar",
  description: "Intelligent chat with OCR, voice input, and artifacts",
};

export default async function AIChatLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await requireAppUser()

  if (!session?.user) {
    redirect("/login")
  }

  return (
    <AIChatLayoutClient>
      {children}
    </AIChatLayoutClient>
  )
}
