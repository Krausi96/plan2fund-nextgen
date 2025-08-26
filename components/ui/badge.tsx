import * as React from "react"

export function Badge({ children, className = "" }: { children: React.ReactNode, className?: string }) {
  return <span className={\inline-block px-2 py-1 text-xs rounded bg-gray-200 text-gray-800 \\}>{children}</span>
}
