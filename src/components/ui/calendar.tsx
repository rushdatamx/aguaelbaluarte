"use client"

import * as React from "react"
import { DayPicker, getDefaultClassNames } from "react-day-picker"
import { es } from "react-day-picker/locale"
import "react-day-picker/style.css"

import { cn } from "@/lib/utils"

export type CalendarProps = React.ComponentProps<typeof DayPicker>

function Calendar({ className, classNames, ...props }: CalendarProps) {
  const defaults = getDefaultClassNames()

  return (
    <DayPicker
      locale={es}
      showOutsideDays
      className={cn("p-1", className)}
      classNames={{
        ...defaults,
        root: cn(defaults.root, "text-sm"),
        months: cn(defaults.months, "flex flex-col sm:flex-row gap-4"),
        month: cn(defaults.month, "space-y-3"),
        month_caption: cn(
          defaults.month_caption,
          "flex justify-center items-center h-9 px-2 font-medium capitalize"
        ),
        nav: cn(defaults.nav, "absolute top-1 right-1 flex items-center gap-1"),
        button_previous: cn(
          defaults.button_previous,
          "h-8 w-8 rounded-md border border-border hover:bg-accent transition-colors inline-flex items-center justify-center"
        ),
        button_next: cn(
          defaults.button_next,
          "h-8 w-8 rounded-md border border-border hover:bg-accent transition-colors inline-flex items-center justify-center"
        ),
        weekday: cn(defaults.weekday, "text-muted-foreground text-xs font-normal"),
        day: cn(defaults.day, "p-0"),
        day_button: cn(
          defaults.day_button,
          "h-9 w-9 rounded-md hover:bg-accent transition-colors font-normal aria-selected:opacity-100"
        ),
        today: cn(defaults.today, "font-semibold text-sky-600"),
        selected: cn(
          defaults.selected,
          "[&>button]:bg-sky-500 [&>button]:text-white [&>button]:hover:bg-sky-600"
        ),
        range_start: cn(defaults.range_start, "[&>button]:rounded-r-none"),
        range_end: cn(defaults.range_end, "[&>button]:rounded-l-none"),
        range_middle: cn(
          defaults.range_middle,
          "[&>button]:bg-sky-100 [&>button]:text-sky-900 [&>button]:rounded-none [&>button]:hover:bg-sky-200"
        ),
        outside: cn(defaults.outside, "text-muted-foreground/40"),
        disabled: cn(defaults.disabled, "opacity-40"),
        ...classNames,
      }}
      {...props}
    />
  )
}

export { Calendar }
