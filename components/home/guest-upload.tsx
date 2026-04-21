"use client"

import { useState } from "react"
import { DocumentUpload } from "@/components/documents/upload"
import { AuthModal } from "@/components/auth/auth-modal"

export function GuestUpload() {
  const [showAuthModal, setShowAuthModal] = useState(false)

  return (
    <>
      <DocumentUpload 
        onUploadSuccess={() => {
          setShowAuthModal(true)
        }} 
      />
      <AuthModal 
        open={showAuthModal} 
        onOpenChange={setShowAuthModal}
        defaultTab="signup"
      />
    </>
  )
}
