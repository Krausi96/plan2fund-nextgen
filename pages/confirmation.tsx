import AppShell from "@/components/layout/AppShell"
import CartSummary from "@/components/confirmation/CartSummary"
import DocsUpload from "@/components/confirmation/DocsUpload"

export default function ConfirmationPage() {
  return (
    <AppShell breadcrumb={["Home", "Confirmation"]}>
      <div className="space-y-6">
        <CartSummary />
        <DocsUpload />
      </div>
    </AppShell>
  )
}
