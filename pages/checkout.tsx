import Link from "next/link";
import featureFlags from "@/lib/featureFlags";
import CartSummary from "@/components/common/CartSummary";
import { useI18n } from "@/contexts/I18nContext";

export default function Checkout() {
  const { t } = useI18n();
  const CHECKOUT_ENABLED = featureFlags.isEnabled('CHECKOUT_ENABLED')
  if (!CHECKOUT_ENABLED) {
    return (
      <main className="max-w-3xl mx-auto py-12 space-y-6">
        <h1 className="text-2xl font-bold">Checkout</h1>
        <p className="text-gray-600">Checkout is currently unavailable.</p>
        <div className="flex justify-between pt-6">
          <Link href="/pricing" className="px-4 py-2 rounded-lg bg-gray-200 hover:bg-gray-300">← Back to Pricing</Link>
          <Link href="/export" className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700">Skip to Export →</Link>
        </div>
      </main>
    )
  }
  return (
    <main className="max-w-3xl mx-auto py-12 space-y-8">
      <h1 className="text-2xl font-bold">Checkout</h1>
      <p className="text-gray-600 mb-6">
        Please review your order and complete the checkout process.
      </p>

      {/* Cart Summary */}
      <CartSummary />

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
          placeholder={t("checkout.cardNumber")}
          className="w-full p-2 border rounded"
        />
        <input
          type="text"
          placeholder={t("checkout.expiryDate")}
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
          href="/pricing"
          className="px-4 py-2 rounded-lg bg-gray-200 hover:bg-gray-300"
        >
          ← Back to Pricing
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

