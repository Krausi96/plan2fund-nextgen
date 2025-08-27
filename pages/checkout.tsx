import Breadcrumbs from "@/components/layout/Breadcrumbs";
import CartSummary from "@/components/confirmation/CartSummary";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { useState } from "react";

export default function CheckoutPage() {
  const [email, setEmail] = useState("");
  const [payment, setPayment] = useState("card");

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8">
      <Breadcrumbs />

      <h1 className="text-2xl font-bold">Checkout</h1>
      <p className="text-gray-600">
        Please review your order and provide payment details.
      </p>

      {/* Cart Summary */}
      <CartSummary />

      {/* Email Field */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Email Address
        </label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="w-full border rounded px-3 py-2"
          placeholder="you@example.com"
        />
      </div>

      {/* Payment Options */}
      <div>
        <h2 className="text-lg font-semibold mb-2">Payment Method</h2>
        <div className="space-y-2">
          <label className="flex items-center gap-2">
            <input
              type="radio"
              checked={payment === "card"}
              onChange={() => setPayment("card")}
            />
            Credit/Debit Card (Visa, MasterCard, AmEx)
          </label>
          <label className="flex items-center gap-2">
            <input
              type="radio"
              checked={payment === "paypal"}
              onChange={() => setPayment("paypal")}
            />
            PayPal
          </label>
          <label className="flex items-center gap-2">
            <input
              type="radio"
              checked={payment === "klarna"}
              onChange={() => setPayment("klarna")}
            />
            Klarna / Pay Later
          </label>
        </div>
      </div>

      {/* Actions */}
      <div className="flex justify-between mt-6">
        <Button variant="outline" asChild>
          <Link href="/confirmation">Back</Link>
        </Button>
        <Button asChild disabled={!email}>
          <Link href="/export">Confirm & Pay →</Link>
        </Button>
      </div>

      {/* Trust Seals */}
      <div className="flex gap-6 text-xs text-gray-500 mt-8">
        <span>✅ GDPR Compliant</span>
        <span>🔒 SSL Secured</span>
        <span>✔ Verified Provider</span>
      </div>
    </div>
  );
}
