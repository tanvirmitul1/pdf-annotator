"use client"

import { useRouter } from "next/navigation"
import { SignUpForm } from "@/components/auth/sign-up-form"

export function SignUpFormWrapper() {
  const router = useRouter()
  
  return (
    <SignUpForm 
      onSwitchToSignIn={() => router.push("/login")} 
    />
  )
}
