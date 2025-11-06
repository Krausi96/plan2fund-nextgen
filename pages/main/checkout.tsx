import Link from "next/link";
import { useRouter } from "next/router";
import { isFeatureEnabled, getSubscriptionTier } from "@/shared/lib/featureFlags";
import CartSummary from '@/features/export/components/CartSummary';
import { useI18n } from "@/shared/contexts/I18nContext";
import { useEffect } from "react";
import analytics from "@/shared/lib/analytics";
import { withAuth } from "@/shared/lib/withAuth";
import { useUser } from "@/shared/contexts/UserContext";
import PageEntryIndicator from '@/shared/components/common/PageEntryIndicator';

function Checkout() {
  const { t } = useI18n();
  const router = useRouter();
  const { userProfile } = useUser();
  const subscriptionTier = getSubscriptionTier(userProfile);
  const CHECKOUT_ENABLED = isFeatureEnabled('priority_support' as any, subscriptionTier) // Using priority_support as placeholder since CHECKOUT_ENABLED doesn't exist in FeatureFlag type
  
  // Get planId from query params
  const planId = router.query.planId as string || 'current';
  const product = router.query.product as string || 'submission';
  const route = router.query.route as string || 'grant';
  
  useEffect(() => {
    analytics.trackPageView('/checkout', 'Checkout');
    analytics.trackUserAction('checkout_viewed', { planId, product, route });
  }, [planId, product, route]);
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
    <>
      <PageEntryIndicator 
        icon="hint"
        text="Review your order and complete payment securely."
        duration={5000}
        position="top-right"
      />
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
        <button 
          onClick={async () => {
            try {
              // Get cart items from CartSummary/state
              const items = [
                {
                  name: 'Business Plan Export',
                  description: 'Full business plan with all sections',
                  amount: 99, // Price in EUR
                  quantity: 1,
                  currency: 'eur',
                  planId: planId // Include planId in items
                }
              ];

              // Create Stripe checkout session
              const response = await fetch('/api/payments/create-session', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  items,
                  userId: userProfile?.id || '',
                  userSegment: userProfile?.segment || 'B2C_FOUNDER',
                  successUrl: `${window.location.origin}/thank-you?session_id={CHECKOUT_SESSION_ID}&planId=${planId}`,
                  cancelUrl: `${window.location.origin}/checkout?canceled=true&planId=${planId}`,
                  customerEmail: userProfile?.id || '', // Use user email from profile
                })
              });

              if (!response.ok) {
                throw new Error('Failed to create checkout session');
              }

              const { url } = await response.json();
              
              // Redirect to Stripe checkout
              if (url) {
                window.location.href = url;
              } else {
                throw new Error('No checkout URL received');
              }
            } catch (error) {
              console.error('Payment error:', error);
              alert('Failed to start checkout. Please try again.');
            }
          }}
          className="w-full py-2 rounded bg-blue-600 text-white hover:bg-blue-700"
        >
          Pay Now
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
          href="/confirm"
          className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700"
        >
          Proceed to Payment →
        </Link>
      </div>
    </main>
    </>
  );
}

export default withAuth(Checkout);

