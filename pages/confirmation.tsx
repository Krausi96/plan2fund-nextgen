import Link from "next/link";
import CartSummary from "@/components/confirmation/CartSummary";
import DocsUpload from "@/components/confirmation/DocsUpload";

export default function Confirmation() {
  return (
    <main className="max-w-3xl mx-auto py-12 space-y-6">
      <h1 className="text-2xl font-bold">Confirmation</h1>
      <p className="text-gray-600">
        Please confirm your details and upload required documents.
      </p>

      {/* Cart Summary Stub */}
      <CartSummary items={[{ name: "Business Plan Package", price: "$199" }]} />

      {/* Multi-file upload */}
      <DocsUpload />

      {/* Navigation */}
      <div className="flex justify-between pt-6">
        <Link
          href="/preview"
          className="px-4 py-2 rounded-lg bg-gray-200 hover:bg-gray-300"
        >
          ← Back to Preview
        </Link>
        <Link
          href="/checkout"
          className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700"
        >
          Continue to Checkout →
        </Link>
      </div>
    </main>
  );
}

