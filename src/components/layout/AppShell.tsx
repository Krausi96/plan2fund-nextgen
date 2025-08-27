import { ReactNode } from "react"

export default function AppShell({ children, breadcrumb }: { children: ReactNode, breadcrumb?: any }) {
  return (
    <div className="min-h-screen flex flex-col">
      {breadcrumb}
      <main className="flex-1">{children}</main>
    </div>
  )
}
