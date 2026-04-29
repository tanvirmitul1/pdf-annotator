"use client"

import { useState } from "react"
import { format, subDays, startOfMonth, endOfMonth, startOfDay, endOfDay } from "date-fns"
import { Calendar as CalendarIcon, X } from "lucide-react"
import { DayPicker } from "react-day-picker"
import "react-day-picker/style.css"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

export interface DateRange {
  from: Date | null
  to: Date | null
}

interface DateRangePreset {
  label: string
  getValue: () => DateRange
}

interface DateRangePickerProps {
  value: DateRange
  onChange: (range: DateRange) => void
  presets?: DateRangePreset[]
  placeholder?: string
  className?: string
}

const defaultPresets: DateRangePreset[] = [
  {
    label: "Today",
    getValue: () => ({
      from: startOfDay(new Date()),
      to: endOfDay(new Date()),
    }),
  },
  {
    label: "Yesterday",
    getValue: () => ({
      from: startOfDay(subDays(new Date(), 1)),
      to: endOfDay(subDays(new Date(), 1)),
    }),
  },
  {
    label: "Last 7 days",
    getValue: () => ({
      from: startOfDay(subDays(new Date(), 6)),
      to: endOfDay(new Date()),
    }),
  },
  {
    label: "Last 30 days",
    getValue: () => ({
      from: startOfDay(subDays(new Date(), 29)),
      to: endOfDay(new Date()),
    }),
  },
  {
    label: "This month",
    getValue: () => ({
      from: startOfMonth(new Date()),
      to: endOfMonth(new Date()),
    }),
  },
]

export function DateRangePicker({
  value,
  onChange,
  presets = defaultPresets,
  placeholder = "Select date range",
  className,
}: DateRangePickerProps) {
  const [open, setOpen] = useState(false)

  const formatRange = () => {
    if (!value.from) return placeholder
    if (!value.to) return format(value.from, "MMM d, yyyy")
    return `${format(value.from, "MMM d, yyyy")} - ${format(value.to, "MMM d, yyyy")}`
  }

  const handleClear = () => {
    onChange({ from: null, to: null })
    setOpen(false)
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            "justify-start text-left font-normal h-10 bg-white dark:bg-neutral-950 border-neutral-200 dark:border-neutral-800",
            !value.from && "text-neutral-500",
            className
          )}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {formatRange()}
          {value.from && (
            <X
              className="ml-auto h-4 w-4 opacity-50 hover:opacity-100"
              onClick={(e) => {
                e.stopPropagation()
                handleClear()
              }}
            />
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <div className="flex">
          <div className="border-r border-neutral-200 dark:border-neutral-800 p-3 space-y-1">
            {presets.map((preset) => (
              <Button
                key={preset.label}
                variant="ghost"
                size="sm"
                className="w-full justify-start font-normal"
                onClick={() => {
                  onChange(preset.getValue())
                  setOpen(false)
                }}
              >
                {preset.label}
              </Button>
            ))}
          </div>
          <div className="p-3">
            <DayPicker
              mode="range"
              selected={
                value.from && value.to
                  ? { from: value.from, to: value.to }
                  : undefined
              }
              onSelect={(range) => {
                if (range) {
                  onChange({
                    from: range.from || null,
                    to: range.to || null,
                  })
                }
              }}
              numberOfMonths={2}
              className="rdp-custom"
            />
          </div>
        </div>
      </PopoverContent>
    </Popover>
  )
}
