﻿import * as React from "react"
import { cn } from "@/lib/utils"

export function Badge({ className, ...props }: React.HTMLAttributes<HTMLSpanElement>) {
  return <span className={cn("inline-flex items-center rounded-md bg-blue-100 px-2 py-1 text-xs font-medium text-blue-800", className)} {...props} />
}
