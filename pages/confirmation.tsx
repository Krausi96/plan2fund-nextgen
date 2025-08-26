import AppShell from "@/components/layout/AppShell";
import CartSummary from "@/components/confirmation/CartSummary";
import DocsUpload from "@/components/confirmation/DocsUpload";

export default function ConfirmationPage() {
  return (
    <AppShell>
      <div className="space-y-8">
        <CartSummary />
        <DocsUpload />
      </div>
    </AppShell>
  );
}
