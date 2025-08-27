import Link from "next/link"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

export default function ChoosePathPage() {
  return (
    <main className="container mx-auto max-w-2xl py-16">
      <h1 className="text-3xl font-bold mb-8 text-center">
        Choose Your Path
      </h1>

      <div className="grid gap-6">
        <Card className="p-6">
          <CardContent>
            <h2 className="text-xl font-semibold mb-2">
              I want to create a plan
            </h2>
            <p className="text-muted-foreground mb-4">
              Guided journey to build a funding plan tailored to your needs.
            </p>
            <Link href="/plan">
              <Button variant="default" size="lg" asChild>
                <span>Start Planning</span>
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card className="p-6">
          <CardContent>
            <h2 className="text-xl font-semibold mb-2">
              I want to see recommendations
            </h2>
            <p className="text-muted-foreground mb-4">
              Get instant funding program recommendations based on your profile.
            </p>
            <Link href="/reco">
              <Button variant="secondary" size="lg" asChild>
                <span>View Recommendations</span>
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </main>
  )
}
