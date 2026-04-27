"use client"

import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/responsive-dialog"
import { SignUpForm } from "@/components/auth/sign-up-form"
import { SignInForm } from "@/components/auth/sign-in-form"

interface AuthModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  defaultTab?: "signin" | "signup"
  callbackUrl?: string
}

export function AuthModal({
  open,
  onOpenChange,
  defaultTab = "signup",
  callbackUrl,
}: AuthModalProps) {
  const [activeTab, setActiveTab] = useState(defaultTab)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTitle className="sr-only">
        {activeTab === "signin" ? "Sign In" : "Create an Account"}
      </DialogTitle>
      <DialogContent
        showCloseButton={false}
        className="w-full overflow-hidden rounded-xl p-0 shadow-2xl ring-0"
        size="md"
      >
        {activeTab === "signin" ? (
          <SignInForm
            callbackUrl={callbackUrl}
            onSwitchToSignUp={() => setActiveTab("signup")}
          />
        ) : (
          <SignUpForm
            callbackUrl={callbackUrl}
            onSwitchToSignIn={() => setActiveTab("signin")}
          />
        )}
      </DialogContent>
    </Dialog>
  )
}
