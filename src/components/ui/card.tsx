import { ReactNode } from "react"

export function Card({ children, className, id }: { children: ReactNode, className?: string, id?: string }) {
  return <div id={id} className={`rounded-2xl shadow p-4 bg-white ${className || ""}`}>{children}</div>
}

