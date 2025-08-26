import AppShell from "@/components/layout/AppShell"

export default function AIPage() {
  return (
    <AppShell breadcrumb={["Home", "AI Plan Machine"]}>
      <div className="p-6">
        <h1 className="text-2xl font-bold">AI Plan Machine</h1>
        <p className="mt-2">Generate AI-powered business and funding insights.</p>
      </div>
    </AppShell>
  )
}
