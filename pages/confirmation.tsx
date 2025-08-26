import CartSummary from "@/components/confirmation/CartSummary";
import DocsUpload from "@/components/confirmation/DocsUpload";
import { Button } from "@/components/ui/button";
import AppShell from "@/components/layout/AppShell";

export default function ConfirmationPage() {
  return (
    <AppShell>
      <div className="max-w-2xl mx-auto p-6 space-y-6">
        <CartSummary />
        <DocsUpload />
        <Button asChild>
          <a href="/checkout">Proceed to Checkout</a>
        </Button>
      </div>
    </AppShell>
  );
}
