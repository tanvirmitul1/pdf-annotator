"use client"

import { useState } from "react"
import { ChevronDown, ChevronUp, ChevronsUpDown, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Skeleton } from "@/components/ui/skeleton"

export interface Column<T> {
  key: string
  label: string
  sortable?: boolean
  render?: (item: T) => React.ReactNode
}

export interface BulkAction<T> {
  label: string
  icon?: React.ReactNode
  variant?: "default" | "destructive"
  onClick: (selectedItems: T[]) => void | Promise<void>
}

interface DataTableProps<T> {
  columns: Column<T>[]
  data: T[]
  keyExtractor: (item: T) => string
  isLoading?: boolean
  emptyMessage?: string
  onSort?: (key: string, direction: "asc" | "desc") => void
  actions?: (item: T) => React.ReactNode
  bulkActions?: BulkAction<T>[]
  selectable?: boolean
}

export function DataTable<T>({
  columns,
  data,
  keyExtractor,
  isLoading,
  emptyMessage = "No data available",
  onSort,
  actions,
  bulkActions,
  selectable = true,
}: DataTableProps<T>) {
  const [sortKey, setSortKey] = useState<string | null>(null)
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc")
  const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set())
  const [isProcessing, setIsProcessing] = useState(false)

  const handleSort = (key: string) => {
    const newDirection = sortKey === key && sortDirection === "asc" ? "desc" : "asc"
    setSortKey(key)
    setSortDirection(newDirection)
    onSort?.(key, newDirection)
  }

  const toggleRow = (id: string) => {
    const newSelected = new Set(selectedRows)
    if (newSelected.has(id)) {
      newSelected.delete(id)
    } else {
      newSelected.add(id)
    }
    setSelectedRows(newSelected)
  }

  const toggleAll = () => {
    if (selectedRows.size === data.length) {
      setSelectedRows(new Set())
    } else {
      setSelectedRows(new Set(data.map(keyExtractor)))
    }
  }

  const handleBulkAction = async (action: BulkAction<T>) => {
    const selectedItems = data.filter((item) => selectedRows.has(keyExtractor(item)))
    setIsProcessing(true)
    try {
      await action.onClick(selectedItems)
      setSelectedRows(new Set())
    } finally {
      setIsProcessing(false)
    }
  }

  const SortIcon = ({ columnKey }: { columnKey: string }) => {
    if (sortKey !== columnKey) return <ChevronsUpDown className="ml-2 h-4 w-4 opacity-50" />
    return sortDirection === "asc" ? (
      <ChevronUp className="ml-2 h-4 w-4" />
    ) : (
      <ChevronDown className="ml-2 h-4 w-4" />
    )
  }

  if (isLoading) {
    return (
      <div className="space-y-3">
        <div className="flex items-center gap-2 mb-4">
          <Skeleton className="h-10 w-32" />
          <Skeleton className="h-10 w-32" />
        </div>
        <div className="rounded-lg border border-neutral-200 dark:border-neutral-800 overflow-hidden">
          <div className="bg-neutral-50 dark:bg-neutral-900 border-b border-neutral-200 dark:border-neutral-800">
            <div className="flex items-center gap-4 px-6 py-4">
              {selectable && <Skeleton className="h-4 w-4" />}
              {columns.map((col) => (
                <Skeleton key={col.key} className="h-4 flex-1" />
              ))}
              {actions && <Skeleton className="h-4 w-20" />}
            </div>
          </div>
          {[...Array(5)].map((_, i) => (
            <div key={i} className="flex items-center gap-4 px-6 py-4 border-b border-neutral-200 dark:border-neutral-800 last:border-0">
              {selectable && <Skeleton className="h-4 w-4" />}
              {columns.map((col) => (
                <Skeleton key={col.key} className="h-4 flex-1" />
              ))}
              {actions && <Skeleton className="h-8 w-20" />}
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (!data.length) {
    return (
      <div className="rounded-lg border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950">
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <p className="text-sm text-neutral-500 dark:text-neutral-400">{emptyMessage}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {selectable && bulkActions && selectedRows.size > 0 && (
        <div className="flex items-center gap-2 p-4 bg-neutral-50 dark:bg-neutral-900 rounded-lg border border-neutral-200 dark:border-neutral-800">
          <span className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
            {selectedRows.size} selected
          </span>
          <div className="flex gap-2 ml-auto">
            {bulkActions.map((action, idx) => (
              <Button
                key={idx}
                size="sm"
                variant={action.variant || "default"}
                onClick={() => handleBulkAction(action)}
                disabled={isProcessing}
              >
                {isProcessing ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  action.icon
                )}
                <span className="ml-2">{action.label}</span>
              </Button>
            ))}
          </div>
        </div>
      )}

      <div className="rounded-lg border border-neutral-200 dark:border-neutral-800 overflow-hidden bg-white dark:bg-neutral-950 shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-neutral-50 dark:bg-neutral-900 border-b border-neutral-200 dark:border-neutral-800">
              <tr>
                {selectable && (
                  <th className="w-12 px-6 py-4 text-left">
                    <Checkbox
                      checked={selectedRows.size === data.length && data.length > 0}
                      onCheckedChange={toggleAll}
                    />
                  </th>
                )}
                {columns.map((col) => (
                  <th
                    key={col.key}
                    className="px-6 py-4 text-left text-xs font-semibold text-neutral-700 dark:text-neutral-300 uppercase tracking-wider"
                  >
                    {col.sortable ? (
                      <button
                        onClick={() => handleSort(col.key)}
                        className="flex items-center hover:text-neutral-900 dark:hover:text-neutral-100 transition-colors"
                      >
                        {col.label}
                        <SortIcon columnKey={col.key} />
                      </button>
                    ) : (
                      col.label
                    )}
                  </th>
                ))}
                {actions && (
                  <th className="px-6 py-4 text-right text-xs font-semibold text-neutral-700 dark:text-neutral-300 uppercase tracking-wider">
                    Actions
                  </th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-200 dark:divide-neutral-800">
              {data.map((item) => {
                const id = keyExtractor(item)
                const isSelected = selectedRows.has(id)
                return (
                  <tr
                    key={id}
                    className={`transition-colors hover:bg-neutral-50 dark:hover:bg-neutral-900/50 ${
                      isSelected ? "bg-neutral-100 dark:bg-neutral-900" : ""
                    }`}
                  >
                    {selectable && (
                      <td className="px-6 py-4">
                        <Checkbox
                          checked={isSelected}
                          onCheckedChange={() => toggleRow(id)}
                        />
                      </td>
                    )}
                    {columns.map((col) => (
                      <td
                        key={col.key}
                        className="px-6 py-4 text-sm text-neutral-900 dark:text-neutral-100"
                      >
                        {col.render
                          ? col.render(item)
                          : String((item as Record<string, unknown>)[col.key] ?? "")}
                      </td>
                    ))}
                    {actions && (
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end">{actions(item)}</div>
                      </td>
                    )}
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
