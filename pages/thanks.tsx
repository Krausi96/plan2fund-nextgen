import Breadcrumbs from "@/components/layout/Breadcrumbs";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function ThanksPage() {
  return (
    <div className="max-w-3xl mx-auto p-6 space-y-8 text-center">
      <Breadcrumbs />

      <h1 className="text-3xl font-bold text-green-600">🎉 Thank You!</h1>
      <p className="text-gray-600">
        Your order has been successfully completed. A copy of your plan has been
        sent to your email.
      </p>

      {/* Revision option */}
      <div className="space-y-4">
        <p className="text-sm text-gray-500">
          Need adjustments? You can request a free revision within 7 days.
        </p>
        <Button asChild variant="outline">
          <a href="mailto:support@plan2fund.com?subject=Revision Request">
            Request Revision
          </a>
        </Button>
      </div>

      {/* Navigation */}
      <div className="flex justify-center gap-4 mt-6">
        <Button asChild>
          <Link href="/">Return to Home</Link>
        </Button>
        <Button asChild variant="secondary">
          <Link href="/plan">Start New Plan</Link>
        </Button>
      </div>
    </div>
  );
}
