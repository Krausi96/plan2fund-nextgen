import * as React from "react"

export function Card({ children, className = "" }: { children: React.ReactNode, className?: string }) {
  return <div className={\ounded-xl border bg-white shadow \\}>{children}</div>
}

export function CardHeader({ children, className = "" }: { children: React.ReactNode, className?: string }) {
  return <div className={\p-4 border-b font-semibold \\}>{children}</div>
}

export function CardTitle({ children, className = "" }: { children: React.ReactNode, className?: string }) {
  return <h3 className={\	ext-lg font-bold \\}>{children}</h3>
}

export function CardContent({ children, className = "" }: { children: React.ReactNode, className?: string }) {
  return <div className={\p-4 \\}>{children}</div>
}
