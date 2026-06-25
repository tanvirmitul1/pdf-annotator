"use client"

import { useState } from "react"
import { useListAdminErrorsQuery, useResolveAdminErrorMutation, useGetAdminErrorStatsQuery } from "@/features/admin/api"
import { DataTable, type Column, type BulkAction } from "@/components/admin/advanced-data-table"
import { AdvancedFilterBar, type FilterOption } from "@/components/admin/advanced-filter-bar"
import { Pagination } from "@/components/admin/pagination"
import { DateRangePicker, type DateRange } from "@/components/ui/date-range-picker"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { MoreHorizontal, CheckCircle, AlertTriangle, XCircle, Code } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import type { AdminErrorLog } from "@/features/admin/api"

export default function ErrorLogsPage() {
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(20)
  const [search, setSearch] = useState("")
  const [filters, setFilters] = useState<Record<string, string>>({})
  const [dateRange, setDateRange] = useState<DateRange>({ from: null, to: null })
  const [resolveDialog, setResolveDialog] = useState<AdminErrorLog | null>(null)
  const [resolveNotes, setResolveNotes] = useState("")
  const { toast } = useToast()

  const { data, isLoading } = useListAdminErrorsQuery({
    page,
    limit,
    search: search || undefined,
    errorType: filters.errorType || undefined,
    resolved: filters.resolved || undefined,
    startDate: dateRange.from?.toISOString(),
    endDate: dateRange.to?.toISOString(),
  })

  const { data: stats } = useGetAdminErrorStatsQuery({
    startDate: dateRange.from?.toISOString(),
    endDate: dateRange.to?.toISOString(),
  })

  const [resolveError] = useResolveAdminErrorMutation()

  const filterOptions: FilterOption[] = [
    {
      key: "errorType",
      label: "Error Type",
      type: "select",
      options: [
        { value: "VALIDATION_ERROR", label: "Validation" },
        { value: "AUTHENTICATION_ERROR", label: "Authentication" },
        { value: "AUTHORIZATION_ERROR", label: "Authorization" },
        { value: "NOT_FOUND_ERROR", label: "Not Found" },
        { value: "RATE_LIMIT_ERROR", label: "Rate Limit" },
        { value: "DATABASE_ERROR", label: "Database" },
        { value: "EXTERNAL_API_ERROR", label: "External API" },
        { value: "FILE_UPLOAD_ERROR", label: "File Upload" },
        { value: "PROCESSING_ERROR", label: "Processing" },
        { value: "INTERNAL_SERVER_ERROR", label: "Internal Server" },
        { value: "UNKNOWN_ERROR", label: "Unknown" },
      ],
    },
    {
      key: "resolved",
      label: "Status",
      type: "select",
      options: [
        { value: "false", label: "Unresolved" },
        { value: "true", label: "Resolved" },
      ],
    },
  ]

  const getErrorIcon = (type: string) => {
    if (type.includes("VALIDATION") || type.includes("NOT_FOUND")) {
      return <AlertTriangle className="h-4 w-4 text-yellow-500" />
    }
    if (type.includes("AUTH")) {
      return <XCircle className="h-4 w-4 text-red-500" />
    }
    return <Code className="h-4 w-4 text-neutral-500" />
  }

  const getErrorVariant = (type: string) => {
    if (type.includes("VALIDATION") || type.includes("NOT_FOUND")) return "warning" as const
    if (type.includes("AUTH") || type.includes("INTERNAL")) return "destructive" as const
    return "secondary" as const
  }

  const columns: Column<AdminErrorLog>[] = [
    {
      key: "errorType",
      label: "Error",
      render: (error) => (
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-neutral-100 dark:bg-neutral-800">
            {getErrorIcon(error.errorType)}
          </div>
          <div>
            <Badge variant={getErrorVariant(error.errorType)} className="mb-1">
              {error.errorType.replace(/_/g, " ")}
            </Badge>
            <div className="text-xs text-neutral-500 truncate max-w-[300px]">
              {error.message}
            </div>
          </div>
        </div>
      ),
    },
    {
      key: "user",
      label: "User",
      render: (error) => (
        <div>
          {error.user ? (
            <>
              <div className="font-medium">{error.user.name || "Anonymous"}</div>
              <div className="text-xs text-neutral-500">{error.user.email}</div>
            </>
          ) : (
            <div className="text-sm text-neutral-500">
              {error.userEmail || "Guest"}
            </div>
          )}
        </div>
      ),
    },
    {
      key: "url",
      label: "Location",
      render: (error) => (
        <div>
          {error.url && (
            <div className="font-mono text-xs text-neutral-600 dark:text-neutral-400 truncate max-w-[200px]">
              {error.method} {error.url}
            </div>
          )}
          {error.statusCode && (
            <div className="text-xs text-neutral-500 mt-1">
              Status: {error.statusCode}
            </div>
          )}
        </div>
      ),
    },
    {
      key: "resolved",
      label: "Status",
      render: (error) => (
        <Badge variant={error.resolved ? "success" : "destructive"}>
          {error.resolved ? "Resolved" : "Unresolved"}
        </Badge>
      ),
    },
    {
      key: "createdAt",
      label: "Time",
      sortable: true,
      render: (error) => (
        <div>
          <div className="text-sm">
            {new Date(error.createdAt).toLocaleDateString()}
          </div>
          <div className="text-xs text-neutral-500">
            {new Date(error.createdAt).toLocaleTimeString()}
          </div>
        </div>
      ),
    },
  ]

  const bulkActions: BulkAction<AdminErrorLog>[] = [
    {
      label: "Mark as Resolved",
      icon: <CheckCircle className="h-4 w-4" />,
      variant: "default",
      onClick: async (errors) => {
        for (const error of errors) {
          if (!error.resolved) {
            await resolveError({ id: error.id, resolved: true }).unwrap()
          }
        }
        toast({ title: `Resolved ${errors.length} error(s)` })
      },
    },
  ]

  const handleResolve = async () => {
    if (!resolveDialog) return
    try {
      await resolveError({
        id: resolveDialog.id,
        resolved: !resolveDialog.resolved,
        resolvedNotes: resolveNotes || undefined,
      }).unwrap()
      toast({
        title: resolveDialog.resolved ? "Error marked as unresolved" : "Error resolved successfully",
      })
      setResolveDialog(null)
      setResolveNotes("")
    } catch {
      toast({ title: "Failed to update error", variant: "destructive" })
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Error Logs</h1>
        <p className="text-neutral-500 dark:text-neutral-400 mt-2">
          Monitor and resolve application errors
        </p>
      </div>

      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="rounded-lg border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 p-4">
            <div className="text-sm font-medium text-neutral-500">Total Errors</div>
            <div className="text-2xl font-bold mt-1">{stats.total}</div>
          </div>
          <div className="rounded-lg border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 p-4">
            <div className="text-sm font-medium text-neutral-500">Unresolved</div>
            <div className="text-2xl font-bold mt-1 text-red-600">{stats.unresolved}</div>
          </div>
          <div className="rounded-lg border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 p-4">
            <div className="text-sm font-medium text-neutral-500">Resolved</div>
            <div className="text-2xl font-bold mt-1 text-green-600">{stats.resolved}</div>
          </div>
          <div className="rounded-lg border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 p-4">
            <div className="text-sm font-medium text-neutral-500">Today</div>
            <div className="text-2xl font-bold mt-1">{stats.todayCount}</div>
          </div>
        </div>
      )}

      <div className="flex flex-col sm:flex-row gap-3">
        <DateRangePicker
          value={dateRange}
          onChange={setDateRange}
          className="w-full sm:w-[280px]"
        />
        <div className="flex-1">
          <AdvancedFilterBar
            searchValue={search}
            onSearchChange={setSearch}
            searchPlaceholder="Search errors..."
            filters={filterOptions}
            filterValues={filters}
            onFilterChange={(key, value) => setFilters({ ...filters, [key]: value })}
            onClear={() => {
              setSearch("")
              setFilters({})
              setDateRange({ from: null, to: null })
            }}
          />
        </div>
      </div>

      <DataTable
        columns={columns}
        data={data?.items || []}
        keyExtractor={(error) => error.id}
        isLoading={isLoading}
        emptyMessage="No errors found"
        bulkActions={bulkActions}
        actions={(error) => (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setResolveDialog(error)}>
                <CheckCircle className="mr-2 h-4 w-4" />
                {error.resolved ? "Mark as Unresolved" : "Mark as Resolved"}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
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

      {resolveDialog && (
        <Dialog open onOpenChange={() => setResolveDialog(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {resolveDialog.resolved ? "Mark as Unresolved" : "Resolve Error"}
              </DialogTitle>
              <DialogDescription>
                {resolveDialog.resolved
                  ? "This will mark the error as unresolved."
                  : "Add optional notes about the resolution."}
              </DialogDescription>
            </DialogHeader>
            {!resolveDialog.resolved && (
              <div className="space-y-2 py-4">
                <Label>Resolution Notes (Optional)</Label>
                <Textarea
                  value={resolveNotes}
                  onChange={(e) => setResolveNotes(e.target.value)}
                  placeholder="Describe how this error was resolved..."
                  rows={4}
                />
              </div>
            )}
            <DialogFooter>
              <Button variant="outline" onClick={() => setResolveDialog(null)}>
                Cancel
              </Button>
              <Button onClick={handleResolve}>
                {resolveDialog.resolved ? "Mark as Unresolved" : "Resolve"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}
