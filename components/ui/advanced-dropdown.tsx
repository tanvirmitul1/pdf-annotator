"use client"

import { useState, useMemo } from "react"
import { Check, ChevronsUpDown, Search, X } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Badge } from "@/components/ui/badge"

export interface DropdownOption {
  value: string
  label: string
  icon?: React.ReactNode
  group?: string
}

interface AdvancedDropdownProps {
  options: DropdownOption[]
  value?: string | string[]
  onChange: (value: string | string[]) => void
  placeholder?: string
  searchPlaceholder?: string
  emptyMessage?: string
  multiSelect?: boolean
  className?: string
  disabled?: boolean
}

export function AdvancedDropdown({
  options,
  value,
  onChange,
  placeholder = "Select option...",
  searchPlaceholder = "Search...",
  emptyMessage = "No options found",
  multiSelect = false,
  className,
  disabled = false,
}: AdvancedDropdownProps) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState("")

  const selectedValues = useMemo(() => {
    if (multiSelect) {
      return Array.isArray(value) ? value : []
    }
    return typeof value === "string" ? [value] : []
  }, [value, multiSelect])

  const filteredOptions = useMemo(() => {
    if (!search) return options
    return options.filter((option) =>
      option.label.toLowerCase().includes(search.toLowerCase())
    )
  }, [options, search])

  const groupedOptions = useMemo(() => {
    const groups: Record<string, DropdownOption[]> = {}
    filteredOptions.forEach((option) => {
      const group = option.group || "default"
      if (!groups[group]) groups[group] = []
      groups[group].push(option)
    })
    return groups
  }, [filteredOptions])

  const handleSelect = (optionValue: string) => {
    if (multiSelect) {
      const newValues = selectedValues.includes(optionValue)
        ? selectedValues.filter((v) => v !== optionValue)
        : [...selectedValues, optionValue]
      onChange(newValues)
    } else {
      onChange(optionValue)
      setOpen(false)
    }
  }

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation()
    onChange(multiSelect ? [] : "")
  }

  const getDisplayText = () => {
    if (selectedValues.length === 0) return placeholder
    if (multiSelect && selectedValues.length > 2) {
      return `${selectedValues.length} selected`
    }
    return selectedValues
      .map((v) => options.find((o) => o.value === v)?.label)
      .filter(Boolean)
      .join(", ")
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          disabled={disabled}
          className={cn(
            "justify-between h-10 bg-white dark:bg-neutral-950 border-neutral-200 dark:border-neutral-800",
            className
          )}
        >
          <span className="truncate">{getDisplayText()}</span>
          <div className="flex items-center gap-1 ml-2">
            {selectedValues.length > 0 && (
              <X
                className="h-4 w-4 opacity-50 hover:opacity-100"
                onClick={handleClear}
              />
            )}
            <ChevronsUpDown className="h-4 w-4 shrink-0 opacity-50" />
          </div>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[300px] p-0" align="start">
        <Command>
          <div className="flex items-center border-b px-3">
            <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
            <input
              placeholder={searchPlaceholder}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="flex h-10 w-full rounded-md bg-transparent py-3 text-sm outline-none placeholder:text-neutral-500 disabled:cursor-not-allowed disabled:opacity-50"
            />
          </div>
          <CommandList className="max-h-[300px]">
            {filteredOptions.length === 0 && (
              <CommandEmpty>{emptyMessage}</CommandEmpty>
            )}
            {Object.entries(groupedOptions).map(([group, groupOptions]) => (
              <CommandGroup key={group} heading={group !== "default" ? group : undefined}>
                {groupOptions.map((option) => (
                  <CommandItem
                    key={option.value}
                    onSelect={() => handleSelect(option.value)}
                  >
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4",
                        selectedValues.includes(option.value) ? "opacity-100" : "opacity-0"
                      )}
                    />
                    {option.icon && <span className="mr-2">{option.icon}</span>}
                    {option.label}
                  </CommandItem>
                ))}
              </CommandGroup>
            ))}
          </CommandList>
        </Command>
        {multiSelect && selectedValues.length > 0 && (
          <div className="border-t p-2 flex flex-wrap gap-1">
            {selectedValues.map((v) => {
              const option = options.find((o) => o.value === v)
              return (
                <Badge key={v} variant="secondary" className="text-xs">
                  {option?.label}
                  <X
                    className="ml-1 h-3 w-3 cursor-pointer"
                    onClick={() => handleSelect(v)}
                  />
                </Badge>
              )
            })}
          </div>
        )}
      </PopoverContent>
    </Popover>
  )
}
