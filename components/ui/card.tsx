import * as React from "react"

export function Card({ children, className = "" }: { children: React.ReactNode, className?: string }) {
  return <div className={\g-white rounded-2xl shadow-md p-4 \\}>{children}</div>
}

export function CardHeader({ children, className = "" }: { children: React.ReactNode, className?: string }) {
  return <div className={\mb-2 font-bold text-lg \\}>{children}</div>
}

export function CardTitle({ children, className = "" }: { children: React.ReactNode, className?: string }) {
  return <h3 className={\	ext-xl font-semibold \\}>{children}</h3>
}

export function CardContent({ children, className = "" }: { children: React.ReactNode, className?: string }) {
  return <div className={\\\}>{children}</div>
}
