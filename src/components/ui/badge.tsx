import { ReactNode } from "react"

export function Badge({ children }: { children: ReactNode }) {
  return <span className="px-2 py-1 rounded bg-gray-200">{children}</span>
}

