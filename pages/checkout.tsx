import Link from "next/link";
import CartSummary from "@/components/confirmation/CartSummary";

export default function Checkout() {
  return (
    <main className="max-w-3xl mx-auto py-12 space-y-8">
      <h1 className="text-2xl font-bold">Checkout</h1>
      <p className="text-gray-600 mb-6">
        Please review your order and complete the checkout process.
      </p>

      {/* Cart Summary Stub */}
      <CartSummary items={[{ name: "Business Plan Package", price: "$199" }]} />

      {/* Trust Seals */}
      <div className="flex gap-6 items-center border-t pt-6">
        <span className="text-sm text-gray-500">🔒 Secure SSL</span>
        <span className="text-sm text-gray-500">💳 Powered by Stripe (stub)</span>
        <span className="text-sm text-gray-500">📜 GDPR Compliant</span>
      </div>

      {/* Payment Stub */}
      <div className="border rounded-lg p-6 bg-gray-50 space-y-4">
        <p className="font-semibold">Payment Details (Stub)</p>
        <input
          type="text"
          placeholder="Card Number"
          className="w-full p-2 border rounded"
        />
        <input
          type="text"
          placeholder="Expiry Date"
          className="w-full p-2 border rounded"
        />
        <input
          type="text"
          placeholder="CVC"
          className="w-full p-2 border rounded"
        />
        <button className="w-full py-2 rounded bg-blue-600 text-white hover:bg-blue-700">
          Pay Now (Stub)
        </button>
      </div>

      {/* Navigation */}
      <div className="flex justify-between pt-6">
        <Link
          href="/confirmation"
          className="px-4 py-2 rounded-lg bg-gray-200 hover:bg-gray-300"
        >
          ← Back to Confirmation
        </Link>
        <Link
          href="/export"
          className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700"
        >
          Continue to Export →
        </Link>
      </div>
    </main>
  );
}

