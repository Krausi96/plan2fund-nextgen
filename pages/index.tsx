import AppShell from "@/components/layout/AppShell";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function HomePage() {
  return (
    <AppShell>
      <section className="text-center py-20 space-y-6">
        <h1 className="text-4xl font-bold">
          Freedom starts with a clear plan — let’s build yours.
        </h1>
        <p className="text-gray-600 max-w-2xl mx-auto">
          Whether you’re shaping an idea, applying for funding or preparing a visa —
          we turn your thoughts into submission-ready business plans.
        </p>
        <div className="flex gap-4 justify-center">
          <Button asChild className="px-6 py-3 text-lg">
            <Link href="/reco">Find Funding</Link>
          </Button>
          <Button asChild variant="outline" className="px-6 py-3 text-lg">
            <Link href="/plan">Generate Business Plan</Link>
          </Button>
        </div>
      </section>
    </AppShell>
  );
}
