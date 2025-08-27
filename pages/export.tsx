import AppShell from "@/components/layout/AppShell"
import ExportPanel from "@/components/export/ExportPanel"
import { Button } from "@/components/ui/button"
import Link from "next/link"

export default function export() {
  return (
    <AppShell breadcrumb={['Home','export']}>
      
  return (
    <div className="max-w-3xl mx-auto py-10 space-y-6">
      <h1 className="text-2xl font-bold">Export Documents</h1>
      <ExportPanel />
      <div className="text-right">
        <Link href="/thanks"><Button>Finish</Button></Link>
      </div>
    </div>
  )

    </AppShell>
  )
}


