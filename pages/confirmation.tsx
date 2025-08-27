import Breadcrumbs from "@/components/layout/Breadcrumbs";
import CartSummary from "@/components/confirmation/CartSummary";
import DocsUpload from "@/components/confirmation/DocsUpload";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function ConfirmationPage() {
  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8">
      <Breadcrumbs />

      <h1 className="text-2xl font-bold">Confirmation</h1>
      <p className="text-gray-600">
        Review your order and upload any supporting documents before checkout.
      </p>

      <CartSummary />
      <DocsUpload />

      <div className="flex justify-between mt-6">
        <Button variant="outline" asChild>
          <Link href="/preview">Back to Preview</Link>
        </Button>
        <Button asChild>
          <Link href="/checkout">Proceed to Checkout →</Link>
        </Button>
      </div>
    </div>
  );
}
