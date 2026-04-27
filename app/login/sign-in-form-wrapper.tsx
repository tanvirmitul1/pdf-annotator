"use client"

import { useRouter } from "next/navigation"
import { SignInForm } from "@/components/auth/sign-in-form"

export function SignInFormWrapper() {
  const router = useRouter()
  
  return (
    <SignInForm 
      onSwitchToSignUp={() => router.push("/signup")} 
    />
  )
}
