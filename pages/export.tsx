import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"

export default function ExportPage() {
  return (
    <div className="max-w-xl mx-auto py-10">
      <h1 className="text-2xl font-bold mb-4">Export Documents</h1>
      <Card className="p-4 mb-6">[DOCX/PDF Export Placeholder]</Card>
      <Link href="/thanks"><Button>Finish</Button></Link>
    </div>
  )
}
