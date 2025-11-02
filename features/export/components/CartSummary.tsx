import { useRouter } from "next/router";
import { calculatePricing, getPricingSummary } from "@/features/export/engine/pricing";

export default function CartSummary() {
  const router = useRouter();
  const { product, route, addonPack } = router.query;

  // Default values if not provided
  const selectedProduct = (product as string) || 'strategy';
  const selectedRoute = (route as string) || 'grant';
  const hasAddonPack = addonPack === 'true';

  const pricing = calculatePricing(
    selectedProduct as 'strategy' | 'review' | 'submission',
    selectedRoute as 'grant' | 'bank' | 'equity' | 'visa' | 'ams',
    hasAddonPack
  );

  const productNames = {
    strategy: "Strategy Document",
    review: "Update & Review",
    submission: "Submission-Ready Business Plan"
  };

  const routeNames = {
    grant: "Grant Template",
    bank: "Bank Template", 
    equity: "Equity Template",
    visa: "Visa Template",
    ams: "AMS Template"
  };

  return (
    <div className="p-6 border rounded-lg bg-white shadow-sm">
      <h2 className="text-xl font-bold mb-4">Your Selection</h2>
      
      <div className="space-y-3">
        <div className="flex justify-between items-center">
          <div>
            <p className="font-semibold text-gray-900">{productNames[selectedProduct as keyof typeof productNames]}</p>
            <p className="text-sm text-gray-600">{routeNames[selectedRoute as keyof typeof routeNames]}</p>
          </div>
          <p className="font-semibold text-lg">
            {pricing.basePrice === 0 ? 'Free' : `€${pricing.basePrice}`}
          </p>
        </div>

        {hasAddonPack && (
          <div className="flex justify-between items-center text-sm">
            <span className="text-gray-600">Add-on Pack</span>
            <span className="font-semibold">+€{pricing.addonPrice}</span>
          </div>
        )}

        <div className="border-t pt-3">
          <div className="flex justify-between items-center">
            <span className="font-bold text-lg">Total</span>
            <span className="font-bold text-xl text-blue-600">
              {getPricingSummary(pricing)}
            </span>
          </div>
          <p className="text-sm text-gray-500 mt-1">
            Delivery: {pricing.deliveryTime}
          </p>
        </div>

        <div className="mt-4 p-3 bg-gray-50 rounded-lg">
          <h3 className="font-semibold text-sm mb-2">What's included:</h3>
          <ul className="text-sm text-gray-600 space-y-1">
            {pricing.includes.map((item, index) => (
              <li key={index} className="flex items-center">
                <span className="w-1.5 h-1.5 bg-green-500 rounded-full mr-2"></span>
                {item}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

