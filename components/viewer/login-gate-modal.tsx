"use client"

import { AuthModal } from "@/components/auth/auth-modal"

interface LoginGateModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  documentId: string
}

export function LoginGateModal({ open, onOpenChange, documentId }: LoginGateModalProps) {
  return (
    <AuthModal
      open={open}
      onOpenChange={onOpenChange}
      defaultTab="signin"
      callbackUrl={`/documents/${documentId}`}
    />
  )
}
