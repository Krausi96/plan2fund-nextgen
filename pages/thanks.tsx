import { Card } from "@/components/ui/card"

export default function ThanksPage() {
  return (
    <div className="max-w-xl mx-auto py-10 text-center">
      <h1 className="text-2xl font-bold mb-4">Thank You!</h1>
      <Card className="p-4">Your plan has been generated. A confirmation email has been sent.</Card>
      <p className="mt-4 text-sm text-muted-foreground">You can request revisions or explore premium services later.</p>
    </div>
  )
}
