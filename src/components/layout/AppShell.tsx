import { ReactNode } from "react"

type AppShellProps = {
  children: ReactNode
  breadcrumb?: ReactNode
}

export default function AppShell({ children, breadcrumb }: AppShellProps) {
  return (
    <div className="min-h-screen flex flex-col">
      {breadcrumb}
      <main className="flex-1">{children}</main>
    </div>
  )
}
