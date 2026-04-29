"use client"

import { useGetAdminHealthQuery } from "@/features/admin/api"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { CheckCircle2, XCircle } from "lucide-react"

export default function AdminSystemPage() {
  const { data, isLoading } = useGetAdminHealthQuery()

  if (isLoading) {
    return <div className="text-muted-foreground">Loading...</div>
  }

  const checks = [
    { name: "Database", status: data?.checks.database },
    { name: "Redis", status: data?.checks.redis },
    { name: "Storage", status: data?.checks.storage },
  ]

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <h3 className="font-semibold mb-4">System Status</h3>
        <div className="flex items-center gap-2 mb-6">
          <Badge variant={data?.status === "healthy" ? "default" : "destructive"} className="text-sm">
            {data?.status?.toUpperCase()}
          </Badge>
        </div>

        <div className="space-y-3">
          {checks.map((check) => (
            <div key={check.name} className="flex items-center justify-between p-3 rounded-lg bg-muted/40">
              <span className="font-medium">{check.name}</span>
              {check.status ? (
                <CheckCircle2 className="size-5 text-green-600" />
              ) : (
                <XCircle className="size-5 text-destructive" />
              )}
            </div>
          ))}
        </div>
      </Card>

      <Card className="p-6">
        <h3 className="font-semibold mb-4">Environment Info</h3>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Environment</span>
            <span className="font-medium">{data?.env}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Node Version</span>
            <span className="font-medium">{data?.nodeVersion}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Uptime</span>
            <span className="font-medium">
              {data?.uptime ? Math.floor(data.uptime / 3600) : 0}h{" "}
              {data?.uptime ? Math.floor((data.uptime % 3600) / 60) : 0}m
            </span>
          </div>
        </div>
      </Card>
    </div>
  )
}
