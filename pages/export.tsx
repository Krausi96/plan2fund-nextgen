import AppShell from "@/components/layout/AppShell"
import ExportPanel from "@/components/export/ExportPanel"
import { Button } from "@/components/ui/button"
import Link from "next/link"

export default function ExportPage(): JSX.Element {
  return (
    <AppShell breadcrumb={['Home','Export']}>
      <div className="p-6">
        <ExportPanel />
        <div className="mt-6 flex justify-end">
          <Link href="/thanks">
            <Button>Finish</Button>
          </Link>
        </div>
      </div>
    </AppShell>
  )
}
