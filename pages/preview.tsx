import AppShell from "@/components/layout/AppShell"
import PreviewPanel from "@/components/preview/PreviewPanel"

export default function PreviewPage() {
  return (
    <AppShell breadcrumb={["Home", "Preview"]}>
      <PreviewPanel />
    </AppShell>
  )
}
