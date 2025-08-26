import AppShell from "@/components/layout/AppShell"

export default function AboutPage() {
  return (
    <AppShell breadcrumb={["Home", "About"]}>
      <div className="p-6">
        <h1 className="text-2xl font-bold">About Plan2Fund</h1>
        <p className="mt-2">This is a demo about page for the NextGen app.</p>
      </div>
    </AppShell>
  )
}
