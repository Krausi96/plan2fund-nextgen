import AppShell from "@/components/layout/AppShell"
import PreviewPanel from "@/components/preview/PreviewPanel"
import PricingPanel from "@/components/preview/PricingPanel"
import { Progress } from "@/components/ui/progress"
import { Button } from "@/components/ui/button"
import Link from "next/link"

export default function preview() {
  return (
    <AppShell breadcrumb={['Home','preview']}>
      
  return (
    <div className="max-w-4xl mx-auto py-10 space-y-8">
      <h1 className="text-2xl font-bold">Preview & Pricing</h1>
      <Progress value={60} />
      <PreviewPanel />
      <PricingPanel />
      <div className="text-right">
        <Link href="/confirmation"><Button>Proceed to Confirmation</Button></Link>
      </div>
    </div>
  )

    </AppShell>
  )
}




