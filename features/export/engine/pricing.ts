// ========= PLAN2FUND — PRICING CALCULATIONS =========
// Pricing calculations for different plan types and add-ons

export interface PricingInfo {
  basePrice: number;
  addonPrice: number;
  totalPrice: number;
  currency: string;
  deliveryTime: string;
  includes: string[];
}

export function calculatePricing(
  product: 'strategy'|'review'|'submission',
  route: 'grant'|'bank'|'equity'|'visa'|'ams',
  addonPack: boolean = false
): PricingInfo {
  // Base pricing by product type
  const basePricing = {
    strategy: 0, // Free for strategy
    review: 99,
    submission: 149
  };

  // Route-specific pricing adjustments
  const routeMultipliers = {
    grant: 1.0,
    bank: 1.2, // More complex for banking
    equity: 1.3, // Most complex for equity
    visa: 1.1, // Slightly more complex for visa
    ams: 1.0
  };

  // Add-on pack pricing
  const addonPricing = {
    price: 39,
    deliveryTime: '3 business days',
    includes: [
      'Rush to first draft',
      'One extra revision included',
      'Provider form help'
    ]
  };

  const basePrice = Math.round(basePricing[product] * routeMultipliers[route]);
  const addonPrice = addonPack ? addonPricing.price : 0;
  const totalPrice = basePrice + addonPrice;

  // Delivery time calculation
  const baseDeliveryTime = product === 'strategy' ? 'Immediate' : 
                          product === 'review' ? '5 business days' : 
                          '7 business days';
  
  const deliveryTime = addonPack ? addonPricing.deliveryTime : baseDeliveryTime;

  // What's included
  const baseIncludes = product === 'strategy' ? [
    'Basic strategy document',
    'Program recommendations',
    'Next steps guidance'
  ] : product === 'review' ? [
    'Updated business plan',
    'Financial projections',
    'Program-specific formatting',
    'One revision included'
  ] : [
    'Submission-ready business plan',
    'Financial projections',
    'Program-specific formatting',
    'Route extras included',
    'Two revisions included'
  ];

  const includes = addonPack ? [...baseIncludes, ...addonPricing.includes] : baseIncludes;

  return {
    basePrice,
    addonPrice,
    totalPrice,
    currency: 'EUR',
    deliveryTime,
    includes
  };
}

export function formatPrice(price: number, currency: string = 'EUR'): string {
  return `${currency} ${price.toFixed(0)}`;
}

export function getPricingSummary(pricing: PricingInfo): string {
  if (pricing.basePrice === 0) {
    return `Free (${pricing.deliveryTime})`;
  }
  
  return `${formatPrice(pricing.totalPrice)} (${pricing.deliveryTime})`;
}
