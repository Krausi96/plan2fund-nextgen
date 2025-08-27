import CartSummary from "@/components/confirmation/CartSummary";
import DocsUpload from "@/components/confirmation/DocsUpload";

export default function ConfirmationPage() {
  return (
    <div className="flex flex-col space-y-6">
      <CartSummary />
      <DocsUpload />
    </div>
  );
}
