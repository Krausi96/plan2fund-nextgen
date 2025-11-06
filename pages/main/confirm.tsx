import Link from "next/link"
import { useEffect, useState } from "react"
import featureFlags from "@/shared/lib/featureFlags"
import { Button } from "@/shared/components/ui/button"
import { useI18n } from "@/shared/contexts/I18nContext"
import analytics from "@/shared/lib/analytics"

export default function ConfirmPage() {
  const { t } = useI18n();
  const CHECKOUT_ENABLED = featureFlags.isEnabled('CHECKOUT_ENABLED')
  useEffect(() => {
    analytics.trackPageView('/confirm', 'Confirm');
  }, []);
  const attachmentTodos = t("confirm.attachmentTodos").split(", ")
  const tier = t("confirm.tier")
  const [email, setEmail] = useState("")
  return (
    <main className="max-w-3xl mx-auto py-12 space-y-6">
      <h1 className="text-2xl font-bold">Confirm Your Order</h1>
      <p className="text-gray-600">Tier selected: {tier}</p>
      <div className="p-4 border rounded">
        <h3 className="font-semibold mb-2">Attachments / Todos</h3>
        <ul className="list-disc list-inside text-sm text-gray-700">
          {attachmentTodos.map((todo, i) => (
            <li key={i} className="flex items-center gap-2">
              {todo}
              <span className="text-xs text-gray-500" title={t("confirm.whyWeNeedThis")}>
                ℹ️
              </span>
            </li>
          ))}
        </ul>
      </div>

      <div className="p-4 border rounded">
        <h3 className="font-semibold mb-2">Contact Information</h3>
        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium mb-1">Email Address</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full border rounded p-2"
              placeholder="your@email.com"
            />
          </div>
        </div>
      </div>

      <div className="p-4 border rounded bg-green-50">
        <h3 className="font-semibold mb-2 text-green-800">Trust & Security</h3>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="flex items-center gap-2">
            <span className="text-green-600">🔒</span>
            <span>SSL Encrypted</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-green-600">🛡️</span>
            <span>GDPR Compliant</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-green-600">✅</span>
            <span>Secure Payment</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-green-600">🔐</span>
            <span>Data Protected</span>
          </div>
        </div>
      </div>
      <div className="flex gap-3">
        <Button asChild disabled={!CHECKOUT_ENABLED}>
          <Link href="/checkout" aria-disabled={!CHECKOUT_ENABLED}>
            Proceed to Checkout
          </Link>
        </Button>
        {!CHECKOUT_ENABLED && (
          <span className="text-xs text-gray-500 self-center">Checkout disabled (demo)</span>
        )}
        <Button asChild variant="outline">
          <Link href="/export">Skip payment (Demo)</Link>
        </Button>
      </div>
    </main>
  )
}


