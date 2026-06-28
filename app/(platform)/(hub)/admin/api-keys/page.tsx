"use client"

import { useState } from "react"
import { useListAdminApiKeysQuery, useRevokeAdminApiKeyMutation } from "@/features/admin/api"
import { DataTable, type Column, type BulkAction } from "@/components/admin/advanced-data-table"
import { AdvancedFilterBar } from "@/components/admin/advanced-filter-bar"
import { Pagination } from "@/components/admin/pagination"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { MoreHorizontal, Key, XCircle } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { useToast } from "@/hooks/use-toast"
import type { AdminApiKey } from "@/features/admin/api"

export default function ApiKeysPage() {
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(20)
  const [search, setSearch] = useState("")
  const [revokeConfirm, setRevokeConfirm] = useState<AdminApiKey | null>(null)
  const { toast } = useToast()

  const { data, isLoading } = useListAdminApiKeysQuery({ page, limit })
  const [revokeApiKey] = useRevokeAdminApiKeyMutation()

  const getStatus = (key: AdminApiKey) => {
    if (key.revokedAt) return { label: "Revoked", variant: "destructive" as const }
    if (key.expiresAt && new Date(key.expiresAt) < new Date())
      return { label: "Expired", variant: "warning" as const }
    return { label: "Active", variant: "success" as const }
  }

  const columns: Column<AdminApiKey>[] = [
    {
      key: "name",
      label: "API Key",
      render: (key) => (
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-neutral-100 dark:bg-neutral-800">
            <Key className="h-5 w-5 text-neutral-600 dark:text-neutral-400" />
          </div>
          <div>
            <div className="font-medium">{key.name}</div>
            <div className="text-xs text-neutral-500 font-mono">{key.prefix}...</div>
          </div>
        </div>
      ),
    },
    {
      key: "user",
      label: "Owner",
      render: (key) => (
        <div>
          <div className="font-medium">{key.user.name || "Anonymous"}</div>
          <div className="text-xs text-neutral-500">{key.user.email}</div>
        </div>
      ),
    },
    {
      key: "status",
      label: "Status",
      render: (key) => {
        const status = getStatus(key)
        return <Badge variant={status.variant}>{status.label}</Badge>
      },
    },
    {
      key: "lastUsedAt",
      label: "Last Used",
      render: (key) => (
        <span className="text-neutral-600 dark:text-neutral-400">
          {key.lastUsedAt
            ? new Date(key.lastUsedAt).toLocaleDateString()
            : "Never"}
        </span>
      ),
    },
    {
      key: "createdAt",
      label: "Created",
      sortable: true,
      render: (key) => (
        <span className="text-neutral-600 dark:text-neutral-400">
          {new Date(key.createdAt).toLocaleDateString()}
        </span>
      ),
    },
  ]

  const bulkActions: BulkAction<AdminApiKey>[] = [
    {
      label: "Revoke Selected",
      icon: <XCircle className="h-4 w-4" />,
      variant: "destructive",
      onClick: async (keys) => {
        for (const key of keys) {
          if (!key.revokedAt) {
            await revokeApiKey(key.id).unwrap()
          }
        }
        toast({ title: `Revoked ${keys.length} API key(s)` })
      },
    },
  ]

  const handleRevoke = async () => {
    if (!revokeConfirm) return
    try {
      await revokeApiKey(revokeConfirm.id).unwrap()
      toast({ title: "API key revoked successfully" })
      setRevokeConfirm(null)
    } catch {
      toast({ title: "Failed to revoke API key", variant: "destructive" })
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">API Keys</h1>
        <p className="text-neutral-500 dark:text-neutral-400 mt-2">
          Manage API keys and access tokens
        </p>
      </div>

      <AdvancedFilterBar
        searchValue={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search API keys..."
        onClear={() => setSearch("")}
      />

      <DataTable
        columns={columns}
        data={data?.items || []}
        keyExtractor={(key) => key.id}
        isLoading={isLoading}
        emptyMessage="No API keys found"
        bulkActions={bulkActions}
        actions={(key) => (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                onClick={() => setRevokeConfirm(key)}
                disabled={!!key.revokedAt}
                className="text-red-600"
              >
                <XCircle className="mr-2 h-4 w-4" />
                Revoke
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

      {revokeConfirm && (
        <AlertDialog open onOpenChange={() => setRevokeConfirm(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Revoke API Key</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to revoke &quot;{revokeConfirm.name}&quot;? This action cannot be
                undone and will immediately invalidate the key.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleRevoke} className="bg-red-600 hover:bg-red-700">
                Revoke
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </div>
  )
}
