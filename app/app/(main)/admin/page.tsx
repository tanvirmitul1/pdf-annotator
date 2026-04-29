"use client"

import { useGetAdminStatsQuery, useListAdminActivityQuery } from "@/features/admin/api"
import { Card } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Users, FileText, MessageSquare, HardDrive, UserCheck } from "lucide-react"

export default function AdminOverviewPage() {
  const { data: stats, isLoading: statsLoading } = useGetAdminStatsQuery()
  const { data: activity } = useListAdminActivityQuery({ limit: 10 })

  if (statsLoading) {
    return <div className="text-muted-foreground">Loading...</div>
  }

  const statCards = [
    {
      label: "Total Users",
      value: stats?.totalUsers ?? 0,
      change: `+${stats?.newUsersThisWeek ?? 0} this week`,
      icon: Users,
    },
    {
      label: "Documents",
      value: stats?.totalDocuments ?? 0,
      icon: FileText,
    },
    {
      label: "Annotations",
      value: stats?.totalAnnotations ?? 0,
      icon: MessageSquare,
    },
    {
      label: "Storage Used",
      value: `${Math.round((stats?.totalStorageMB ?? 0) / 1024)} GB`,
      icon: HardDrive,
    },
    {
      label: "Active Users",
      value: stats?.activeUsers ?? 0,
      change: "Last 7 days",
      icon: UserCheck,
    },
  ]

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {statCards.map((stat) => (
          <Card key={stat.label} className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">{stat.label}</p>
                <p className="text-3xl font-bold mt-2">{stat.value}</p>
                {stat.change && (
                  <p className="text-xs text-muted-foreground mt-1">{stat.change}</p>
                )}
              </div>
              <stat.icon className="size-8 text-muted-foreground" />
            </div>
          </Card>
        ))}
      </div>

      {stats?.usersByPlan && stats.usersByPlan.length > 0 && (
        <Card className="p-6">
          <h3 className="font-semibold mb-4">Users by Plan</h3>
          <div className="space-y-2">
            {stats.usersByPlan.map((plan) => (
              <div key={plan.planId} className="flex items-center justify-between">
                <span className="text-sm capitalize">{plan.planId}</span>
                <span className="text-sm font-medium">{plan.count}</span>
              </div>
            ))}
          </div>
        </Card>
      )}

      {activity?.items && activity.items.length > 0 && (
        <Card className="p-6">
          <h3 className="font-semibold mb-4">Recent Activity</h3>
          <div className="space-y-3">
            {activity.items.map((log) => (
              <div key={log.id} className="flex items-center gap-3">
                <Avatar className="size-8">
                  <AvatarImage src={log.user.image ?? undefined} />
                  <AvatarFallback className="text-xs">
                    {log.user.name?.[0] ?? "U"}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="text-sm">
                    <span className="font-medium">{log.user.name ?? log.user.email}</span>{" "}
                    <span className="text-muted-foreground">{log.action}</span>
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(log.createdAt).toLocaleString()}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  )
}
