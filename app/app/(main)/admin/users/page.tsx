"use client"

import { useState } from "react"
import Image from "next/image"
import { useListAdminUsersQuery, useUpdateAdminUserMutation, useDeleteAdminUserMutation } from "@/features/admin/api"
import { DataTable, type Column, type BulkAction } from "@/components/admin/advanced-data-table"
import { AdvancedFilterBar, type FilterOption } from "@/components/admin/advanced-filter-bar"
import { Pagination } from "@/components/admin/pagination"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { MoreHorizontal, Pencil, Trash2 } from "lucide-react"
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Label } from "@/components/ui/label"
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
import type { AdminUser } from "@/features/admin/api"

export default function UsersPage() {
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(20)
  const [search, setSearch] = useState("")
  const [filters, setFilters] = useState<Record<string, string>>({})
  const [editUser, setEditUser] = useState<AdminUser | null>(null)
  const [deleteConfirm, setDeleteConfirm] = useState<AdminUser | null>(null)
  const { toast } = useToast()

  const { data, isLoading } = useListAdminUsersQuery({
    page,
    limit,
    search: search || undefined,
    role: filters.role || undefined,
    planId: filters.planId || undefined,
  })

  const [updateUser] = useUpdateAdminUserMutation()
  const [deleteUser] = useDeleteAdminUserMutation()

  const filterOptions: FilterOption[] = [
    {
      key: "role",
      label: "Role",
      type: "select",
      options: [
        { value: "USER", label: "User" },
        { value: "ADMIN", label: "Admin" },
      ],
    },
    {
      key: "planId",
      label: "Plan",
      type: "select",
      options: [
        { value: "free", label: "Free" },
        { value: "pro", label: "Pro" },
        { value: "enterprise", label: "Enterprise" },
      ],
    },
  ]

  const columns: Column<AdminUser>[] = [
    {
      key: "name",
      label: "User",
      render: (user) => (
        <div className="flex items-center gap-3">
          {user.image && (
            <Image src={user.image} alt="" width={32} height={32} className="h-8 w-8 rounded-full" />
          )}
          <div>
            <div className="font-medium">{user.name || "Anonymous"}</div>
            <div className="text-xs text-neutral-500">{user.email}</div>
          </div>
        </div>
      ),
    },
    {
      key: "role",
      label: "Role",
      sortable: true,
      render: (user) => (
        <Badge variant={user.role === "ADMIN" ? "default" : "secondary"}>
          {user.role}
        </Badge>
      ),
    },
    {
      key: "planId",
      label: "Plan",
      sortable: true,
      render: (user) => (
        <Badge variant="outline" className="capitalize">
          {user.planId}
        </Badge>
      ),
    },
    {
      key: "subscriptionStatus",
      label: "Status",
      render: (user) => {
        const variant =
          user.subscriptionStatus === "ACTIVE"
            ? "success"
            : user.subscriptionStatus === "FREE"
            ? "secondary"
            : "warning"
        return <Badge variant={variant}>{user.subscriptionStatus}</Badge>
      },
    },
    {
      key: "documents",
      label: "Documents",
      render: (user) => (
        <span className="text-neutral-600 dark:text-neutral-400">
          {user._count.documents}
        </span>
      ),
    },
    {
      key: "createdAt",
      label: "Joined",
      sortable: true,
      render: (user) => (
        <span className="text-neutral-600 dark:text-neutral-400">
          {new Date(user.createdAt).toLocaleDateString()}
        </span>
      ),
    },
  ]

  const bulkActions: BulkAction<AdminUser>[] = [
    {
      label: "Delete Selected",
      icon: <Trash2 className="h-4 w-4" />,
      variant: "destructive",
      onClick: async (users) => {
        for (const user of users) {
          await deleteUser(user.id).unwrap()
        }
        toast({ title: `Deleted ${users.length} user(s)` })
      },
    },
  ]

  const handleSave = async () => {
    if (!editUser) return
    try {
      await updateUser({
        id: editUser.id,
        data: {
          role: editUser.role,
          planId: editUser.planId,
          subscriptionStatus: editUser.subscriptionStatus,
        },
      }).unwrap()
      toast({ title: "User updated successfully" })
      setEditUser(null)
    } catch {
      toast({ title: "Failed to update user", variant: "destructive" })
    }
  }

  const handleDelete = async () => {
    if (!deleteConfirm) return
    try {
      await deleteUser(deleteConfirm.id).unwrap()
      toast({ title: "User deleted successfully" })
      setDeleteConfirm(null)
    } catch {
      toast({ title: "Failed to delete user", variant: "destructive" })
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Users</h1>
        <p className="text-neutral-500 dark:text-neutral-400 mt-2">
          Manage user accounts, roles, and subscriptions
        </p>
      </div>

      <AdvancedFilterBar
        searchValue={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search by name or email..."
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
        keyExtractor={(user) => user.id}
        isLoading={isLoading}
        emptyMessage="No users found"
        bulkActions={bulkActions}
        actions={(user) => (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setEditUser(user)}>
                <Pencil className="mr-2 h-4 w-4" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => setDeleteConfirm(user)}
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

      {editUser && (
        <Dialog open onOpenChange={() => setEditUser(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit User</DialogTitle>
              <DialogDescription>
                Update user role, plan, and subscription status
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Role</Label>
                <Select
                  value={editUser.role}
                  onValueChange={(value) =>
                    setEditUser({ ...editUser, role: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="USER">User</SelectItem>
                    <SelectItem value="ADMIN">Admin</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Plan</Label>
                <Select
                  value={editUser.planId}
                  onValueChange={(value) =>
                    setEditUser({ ...editUser, planId: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="free">Free</SelectItem>
                    <SelectItem value="pro">Pro</SelectItem>
                    <SelectItem value="enterprise">Enterprise</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Subscription Status</Label>
                <Select
                  value={editUser.subscriptionStatus}
                  onValueChange={(value) =>
                    setEditUser({ ...editUser, subscriptionStatus: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="FREE">Free</SelectItem>
                    <SelectItem value="TRIALING">Trialing</SelectItem>
                    <SelectItem value="ACTIVE">Active</SelectItem>
                    <SelectItem value="PAST_DUE">Past Due</SelectItem>
                    <SelectItem value="CANCELED">Canceled</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setEditUser(null)}>
                Cancel
              </Button>
              <Button onClick={handleSave}>Save Changes</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {deleteConfirm && (
        <AlertDialog open onOpenChange={() => setDeleteConfirm(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete User</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete {deleteConfirm.name}? This action cannot be
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
