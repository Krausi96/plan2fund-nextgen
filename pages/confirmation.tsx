import AppShell from "@/components/layout/AppShell"
import CartSummary from "@/components/confirmation/CartSummary"
import DocsUpload from "@/components/confirmation/DocsUpload"
import { Button } from "@/components/ui/button"
import Link from "next/link"

export default function confirmation() {
  return (
    <AppShell breadcrumb={['Home','confirmation']}>
      
  return (
    <div className="max-w-3xl mx-auto py-10 space-y-6">
      <h1 className="text-2xl font-bold">Confirmation</h1>
      <DocsUpload onUpload={() => {}} />
      <CartSummary />
      <div className="text-right">
        <Link href="/checkout"><Button>Proceed to Checkout</Button></Link>
      </div>
    </div>
  )

    </AppShell>
  )
}









