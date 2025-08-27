import { ReactNode } from "react"

export function Dialog({ children }: { children: ReactNode }) {
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black/50">
      {children}
    </div>
  )
}

