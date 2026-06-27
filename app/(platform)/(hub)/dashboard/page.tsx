"use client"

import { useState, useEffect } from "react"
import { Skeleton } from "@/components/ui/skeleton"
import { SERVICES } from "@/lib/services/registry"
import { ServiceCardWrapper } from "@/components/platform/service-card-wrapper"
import { DashboardContent } from "@/components/platform/dashboard-content"
import { useGetDashboardStatsQuery } from "@/features/dashboard/api"

function getGreeting() {
  const hour = new Date().getHours()
  if (hour < 12) return "Good morning"
  if (hour < 17) return "Good afternoon"
  return "Good evening"
}

function DashboardSkeleton() {
  return (
    <div className="min-h-[calc(100vh-3.5rem)] bg-background">
      <div className="relative overflow-hidden border-b border-border/30">
        <div className="mx-auto max-w-[1400px] px-6 sm:px-8 lg:px-12 py-8">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="space-y-2">
              <Skeleton className="h-4 w-44" />
              <Skeleton className="h-9 w-72" />
              <Skeleton className="h-4 w-56" />
            </div>
            <div className="flex items-center gap-2.5">
              <Skeleton className="h-9 w-36 rounded-md" />
              <Skeleton className="h-9 w-24 rounded-md" />
            </div>
          </div>
        </div>
      </div>
      <div className="mx-auto max-w-[1400px] px-6 sm:px-8 lg:px-12 py-8 space-y-8">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="rounded-2xl border border-border/30 bg-card/70 p-5">
              <div className="flex items-center justify-between mb-4">
                <Skeleton className="size-11 rounded-xl" />
                <Skeleton className="h-5 w-14 rounded-full" />
              </div>
              <Skeleton className="h-9 w-14 mb-1" />
              <Skeleton className="h-4 w-24" />
            </div>
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <div className="rounded-2xl border border-border/30 bg-card/70 p-6">
              <Skeleton className="h-5 w-40 mb-1" />
              <Skeleton className="h-3.5 w-52 mb-6" />
              <div className="flex items-end gap-2 h-24">
                {Array.from({ length: 7 }).map((_, i) => (
                  <Skeleton key={i} className="flex-1 rounded-lg" style={{ height: `${28 + i * 7}px` }} />
                ))}
              </div>
            </div>
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="rounded-2xl border border-border/30 bg-card/70 p-7">
                  <Skeleton className="size-14 rounded-2xl mb-5" />
                  <Skeleton className="h-6 w-40 mb-2" />
                  <Skeleton className="h-4 w-full mb-1" />
                  <Skeleton className="h-4 w-3/4" />
                </div>
              ))}
            </div>
          </div>
          <div className="space-y-5">
            <div className="rounded-2xl border border-border/30 bg-card/70 p-6">
              <Skeleton className="h-5 w-36 mb-4" />
              <Skeleton className="size-32 rounded-full mx-auto mb-5" />
              <div className="space-y-3">
                {Array.from({ length: 2 }).map((_, i) => (
                  <div key={i} className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <Skeleton className="h-4 w-24" />
                      <Skeleton className="h-4 w-16" />
                    </div>
                    <Skeleton className="h-1 w-full rounded-full" />
                  </div>
                ))}
              </div>
            </div>
            <div className="rounded-2xl border border-border/30 bg-card/70 p-6">
              <Skeleton className="h-5 w-28 mb-3" />
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="flex items-center gap-3 p-3">
                  <Skeleton className="size-9 rounded-lg shrink-0" />
                  <div className="flex-1 space-y-1.5">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-3 w-20" />
                  </div>
                </div>
              ))}
            </div>
            <div className="rounded-2xl border border-border/30 bg-card/70 p-6">
              <Skeleton className="size-10 rounded-xl mb-3" />
              <Skeleton className="h-4 w-20 mb-2" />
              <Skeleton className="h-3.5 w-full mb-1" />
              <Skeleton className="h-3.5 w-2/3 mb-3" />
              <Skeleton className="h-7 w-24 rounded-md" />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function DashboardPage() {
  const { data, isLoading } = useGetDashboardStatsQuery()
  const [greeting, setGreeting] = useState("")

  useEffect(() => {
    setGreeting(getGreeting())
  }, [])

  if (isLoading || !data) {
    return <DashboardSkeleton />
  }

  const firstName = data.user.name?.split(" ")[0] || "there"

  const accessMap = new Map(
    data.serviceAccess.map((access) => [access.service, access.enabled])
  )

  const statsMap: Record<string, { label: string; value: number }> = {
    DOCUMENTS: { label: "Documents", value: data.documentCount },
    AI_CHAT: { label: "Conversations", value: data.chatCount },
  }

  return (
    <DashboardContent
      firstName={firstName}
      greeting={greeting}
      documentCount={data.documentCount}
      chatCount={data.chatCount}
    >
      <ServiceCardWrapper
        services={SERVICES.map((service) => ({
          id: service.id,
          name: service.name,
          description: service.description,
          iconName: service.iconName,
          path: service.path,
          enabled: (accessMap.get(service.id) ?? true) && service.enabled,
          comingSoon: service.comingSoon,
          stats: statsMap[service.id],
        }))}
      />
    </DashboardContent>
  )
}
