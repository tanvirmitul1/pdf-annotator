"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog"
import { SignUpForm } from "@/components/auth/sign-up-form"
import { SignInForm } from "@/components/auth/sign-in-form"

interface AuthModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  defaultTab?: "signin" | "signup"
  callbackUrl?: string
}

export function AuthModal({ open, onOpenChange, defaultTab = "signup", callbackUrl }: AuthModalProps) {
  const [activeTab, setActiveTab] = useState(defaultTab)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTitle className="sr-only">
        {activeTab === "signin" ? "Sign In" : "Create an Account"}
      </DialogTitle>
      <DialogContent
        showCloseButton={false}
        className="p-0 ring-0 shadow-2xl max-w-[420px] w-full overflow-hidden rounded-[2rem]"
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
