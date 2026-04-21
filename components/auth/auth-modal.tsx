"use client"

import { useState } from "react"
import { Dialog, DialogContent } from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { SignUpForm } from "@/components/auth/sign-up-form"
import { SignInForm } from "@/components/auth/sign-in-form"

interface AuthModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  defaultTab?: "signin" | "signup"
}

export function AuthModal({ open, onOpenChange, defaultTab = "signup" }: AuthModalProps) {
  const [activeTab, setActiveTab] = useState(defaultTab)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg rounded-[2rem] border-border/70 bg-card/98 p-0 backdrop-blur-xl sm:max-w-xl">
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "signin" | "signup")} className="w-full">
          <TabsList className="mx-6 mt-6 grid w-auto grid-cols-2 rounded-[1.2rem] bg-muted/60 p-1">
            <TabsTrigger value="signup" className="rounded-[1rem] data-[state=active]:bg-card data-[state=active]:shadow-sm">
              Sign Up
            </TabsTrigger>
            <TabsTrigger value="signin" className="rounded-[1rem] data-[state=active]:bg-card data-[state=active]:shadow-sm">
              Sign In
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="signup" className="mt-0 p-6">
            <SignUpForm compact />
          </TabsContent>
          
          <TabsContent value="signin" className="mt-0 p-6">
            <SignInForm compact />
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}
