import Link from "next/link"
import { Button } from "@/components/ui/button"

export default function HomePage() {
  return (
    <section className="text-center py-20">
      <h1 className="text-4xl font-bold mb-6">Freedom starts with a clear plan — let’s build yours.</h1>
      <p className="mb-8 text-muted-foreground">
        Choose your path below to get started.
      </p>
      <div className="flex justify-center gap-4">
        <Link href="/reco">
          <Button size="lg">Find Funding</Button>
        </Link>
        <Link href="/plan">
          <Button size="lg" variant="secondary">Generate Plan</Button>
        </Link>
      </div>
    </section>
  )
}
