import { ReactNode } from "react"
import Header from "@/components/layout/Header"
import Footer from "@/components/layout/Footer"
import Breadcrumbs from "@/components/layout/Breadcrumbs"

interface BreadcrumbItem {
  label: string
  href?: string
}

interface AppShellProps {
  children: ReactNode
  breadcrumb?: BreadcrumbItem[]
}

export default function AppShell({ children, breadcrumb }: AppShellProps) {
  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      {breadcrumb && <Breadcrumbs items={breadcrumb} />}
      <main className="flex-1 container mx-auto px-4 py-6">{children}</main>
      <Footer />
    </div>
  )
}
