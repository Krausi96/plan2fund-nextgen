import AppShell from "@/components/layout/AppShell"
import Editor from "@/components/plan/Editor"

export default function PlanPage() {
  return (
    <AppShell breadcrumb={["Home", "Plan"]}>
      <Editor />
    </AppShell>
  )
}
