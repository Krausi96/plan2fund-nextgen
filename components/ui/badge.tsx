import * as React from "react"

type Variant = "default" | "destructive" | "success" | "info"

export function Badge({
  children,
  className = "",
  variant = "default",
}: {
  children: React.ReactNode
  className?: string
  variant?: Variant
}) {
  let base = "inline-block px-2 py-1 text-xs font-semibold rounded"
  let styles = ""

  switch (variant) {
    case "destructive":
      styles = "bg-red-100 text-red-800"
      break
    case "success":
      styles = "bg-green-100 text-green-800"
      break
    case "info":
      styles = "bg-blue-100 text-blue-800"
      break
    default:
      styles = "bg-gray-200 text-gray-800"
  }

  return <span className={\\ \ \\}>{children}</span>
}
