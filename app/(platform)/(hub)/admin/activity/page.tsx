"use client"

import { useState } from "react"
import { useListAdminActivityQuery } from "@/features/admin/api"
import { DataTable, type Column } from "@/components/admin/advanced-data-table"
import { AdvancedFilterBar, type FilterOption } from "@/components/admin/advanced-filter-bar"
import { Pagination } from "@/components/admin/pagination"
import { Activity, Database, FileText, Key, Shield, User } from "lucide-react"
import type { AdminActivity } from "@/features/admin/api"

export default function ActivityPage() {
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(20)
  const [search, setSearch] = useState("")
  const [filters, setFilters] = useState<Record<string, string>>({})

  const { data, isLoading } = useListAdminActivityQuery({
    page,
    limit,
    action: search || undefined,
    resourceType: filters.resourceType || undefined,
  })

  const filterOptions: FilterOption[] = [
    {
      key: "resourceType",
      label: "Resource Type",
      type: "select",
      options: [
        { value: "User", label: "User" },
        { value: "Document", label: "Document" },
        { value: "ApiKey", label: "API Key" },
        { value: "Plan", label: "Plan" },
      ],
    },
  ]

  const getActionIcon = (action: string) => {
    if (action.includes("user")) return <User className="h-4 w-4" />
    if (action.includes("document")) return <FileText className="h-4 w-4" />
    if (action.includes("api_key")) return <Key className="h-4 w-4" />
    if (action.includes("plan")) return <Database className="h-4 w-4" />
    if (action.includes("admin")) return <Shield className="h-4 w-4" />
    return <Activity className="h-4 w-4" />
  }

  const columns: Column<AdminActivity>[] = [
    {
      key: "action",
      label: "Action",
      render: (log) => (
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-neutral-100 dark:bg-neutral-800">
            {getActionIcon(log.action)}
          </div>
          <div>
            <div className="font-medium">{log.action}</div>
            <div className="text-xs text-neutral-500">{log.resourceType}</div>
          </div>
        </div>
      ),
    },
    {
      key: "user",
      label: "User",
      render: (log) => (
        <div>
          <div className="font-medium">{log.user.name || "Anonymous"}</div>
          <div className="text-xs text-neutral-500">{log.user.email}</div>
        </div>
      ),
    },
    {
      key: "resourceId",
      label: "Resource ID",
      render: (log) => (
        <span className="font-mono text-xs text-neutral-600 dark:text-neutral-400">
          {log.resourceId.slice(0, 12)}...
        </span>
      ),
    },
    {
      key: "ipAddress",
      label: "IP Address",
      render: (log) => (
        <span className="font-mono text-xs text-neutral-600 dark:text-neutral-400">
          {log.ipAddress}
        </span>
      ),
    },
    {
      key: "createdAt",
      label: "Timestamp",
      sortable: true,
      render: (log) => (
        <div>
          <div className="text-sm">
            {new Date(log.createdAt).toLocaleDateString()}
          </div>
          <div className="text-xs text-neutral-500">
            {new Date(log.createdAt).toLocaleTimeString()}
          </div>
        </div>
      ),
    },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Activity Log</h1>
        <p className="text-neutral-500 dark:text-neutral-400 mt-2">
          Monitor all administrative actions and system events
        </p>
      </div>

      <AdvancedFilterBar
        searchValue={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search actions..."
        filters={filterOptions}
        filterValues={filters}
        onFilterChange={(key, value) => setFilters({ ...filters, [key]: value })}
        onClear={() => {
          setSearch("")
          setFilters({})
        }}
      />

      <DataTable
        columns={columns}
        data={data?.items || []}
        keyExtractor={(log) => log.id}
        isLoading={isLoading}
        emptyMessage="No activity logs found"
        selectable={false}
      />

      {data?.pagination && (
        <Pagination
          currentPage={page}
          totalPages={data.pagination.totalPages}
          pageSize={limit}
          totalItems={data.pagination.totalItems}
          onPageChange={setPage}
          onPageSizeChange={setLimit}
        />
      )}
    </div>
  )
}
