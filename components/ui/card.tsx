import * as React from "react"

export function Card({ children, className = "" }: { children: React.ReactNode, className?: string }) {
  return <div className={\g-white rounded-2xl shadow-md p-4 \\}>{children}</div>
}

export function CardHeader({ children }: { children: React.ReactNode }) {
  return <div className="mb-2 font-bold text-lg">{children}</div>
}

export function CardTitle({ children }: { children: React.ReactNode }) {
  return <h3 className="text-xl font-semibold">{children}</h3>
}

export function CardContent({ children }: { children: React.ReactNode }) {
  return <div className="text-gray-700">{children}</div>
}
