import * as React from "react"

export function Dialog({ children, open }: { children: React.ReactNode, open?: boolean }) {
  if (!open) return null
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
      <div className="bg-white rounded-xl shadow-lg w-full max-w-lg p-6">{children}</div>
    </div>
  )
}

export function DialogContent({ children }: { children: React.ReactNode }) {
  return <div className="mt-2">{children}</div>
}

export function DialogHeader({ children }: { children: React.ReactNode }) {
  return <div className="mb-4">{children}</div>
}

export function DialogTitle({ children }: { children: React.ReactNode }) {
  return <h2 className="text-xl font-bold">{children}</h2>
}
