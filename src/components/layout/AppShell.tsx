import { ReactNode } from "react"
import Header from "@/components/layout/Header"
import Footer from "@/components/layout/Footer"
import Breadcrumbs from "@/components/layout/Breadcrumbs"

type BreadcrumbItem = { label: string; href?: string }

export default function AppShell({ 
  children, 
  breadcrumb = [] 
}: { 
  children: ReactNode, 
  breadcrumb?: BreadcrumbItem[] 
}) {
  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      {breadcrumb.length > 0 && (
        <div className="bg-gray-50 border-b">
          <Breadcrumbs items={breadcrumb} />
        </div>
      )}
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  )
}
