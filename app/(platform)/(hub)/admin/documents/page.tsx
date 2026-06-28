"use client"

import { useState } from "react"
import { useListAdminDocumentsQuery, useDeleteAdminDocumentMutation } from "@/features/admin/api"
import { DataTable, type Column, type BulkAction } from "@/components/admin/advanced-data-table"
import { AdvancedFilterBar, type FilterOption } from "@/components/admin/advanced-filter-bar"
import { Pagination } from "@/components/admin/pagination"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { MoreHorizontal, Eye, Download, Trash2, FileText } from "lucide-react"
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
import type { AdminDocument } from "@/features/admin/api"

export default function DocumentsPage() {
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(20)
  const [search, setSearch] = useState("")
  const [filters, setFilters] = useState<Record<string, string>>({})
  const [deleteConfirm, setDeleteConfirm] = useState<AdminDocument | null>(null)
  const { toast } = useToast()

  const { data, isLoading } = useListAdminDocumentsQuery({
    page,
    limit,
    search: search || undefined,
    status: filters.status || undefined,
  })

  const [deleteDocument] = useDeleteAdminDocumentMutation()

  const filterOptions: FilterOption[] = [
    {
      key: "status",
      label: "Status",
      type: "select",
      options: [
        { value: "PROCESSING", label: "Processing" },
        { value: "READY", label: "Ready" },
        { value: "FAILED", label: "Failed" },
      ],
    },
  ]

  const columns: Column<AdminDocument>[] = [
    {
      key: "name",
      label: "Document",
      render: (doc) => (
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-neutral-100 dark:bg-neutral-800">
            <FileText className="h-5 w-5 text-neutral-600 dark:text-neutral-400" />
          </div>
          <div>
            <div className="font-medium">{doc.name}</div>
            <div className="text-xs text-neutral-500">{doc.pageCount} pages</div>
          </div>
        </div>
      ),
    },
    {
      key: "user",
      label: "Owner",
      render: (doc) => (
        <div>
          <div className="font-medium">{doc.user.name || "Anonymous"}</div>
          <div className="text-xs text-neutral-500">{doc.user.email}</div>
        </div>
      ),
    },
    {
      key: "status",
      label: "Status",
      sortable: true,
      render: (doc) => {
        const variant =
          doc.status === "READY"
            ? "success"
            : doc.status === "PROCESSING"
            ? "warning"
            : "destructive"
        return <Badge variant={variant}>{doc.status}</Badge>
      },
    },
    {
      key: "fileSize",
      label: "Size",
      render: (doc) => (
        <span className="text-neutral-600 dark:text-neutral-400">
          {(doc.fileSize / 1024 / 1024).toFixed(2)} MB
        </span>
      ),
    },
    {
      key: "createdAt",
      label: "Uploaded",
      sortable: true,
      render: (doc) => (
        <span className="text-neutral-600 dark:text-neutral-400">
          {new Date(doc.createdAt).toLocaleDateString()}
        </span>
      ),
    },
  ]

  const bulkActions: BulkAction<AdminDocument>[] = [
    {
      label: "Delete Selected",
      icon: <Trash2 className="h-4 w-4" />,
      variant: "destructive",
      onClick: async (docs) => {
        for (const doc of docs) {
          await deleteDocument(doc.id).unwrap()
        }
        toast({ title: `Deleted ${docs.length} document(s)` })
      },
    },
  ]

  const handleDelete = async () => {
    if (!deleteConfirm) return
    try {
      await deleteDocument(deleteConfirm.id).unwrap()
      toast({ title: "Document deleted successfully" })
      setDeleteConfirm(null)
    } catch {
      toast({ title: "Failed to delete document", variant: "destructive" })
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Documents</h1>
        <p className="text-neutral-500 dark:text-neutral-400 mt-2">
          Manage all documents across the platform
        </p>
      </div>

      <AdvancedFilterBar
        searchValue={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search documents..."
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
        keyExtractor={(doc) => doc.id}
        isLoading={isLoading}
        emptyMessage="No documents found"
        bulkActions={bulkActions}
        actions={(doc) => (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem>
                <Eye className="mr-2 h-4 w-4" />
                View
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Download className="mr-2 h-4 w-4" />
                Download
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => setDeleteConfirm(doc)}
                className="text-red-600"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
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

      {deleteConfirm && (
        <AlertDialog open onOpenChange={() => setDeleteConfirm(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Document</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete &quot;{deleteConfirm.name}&quot;? This action cannot be
                undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700">
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </div>
  )
}
