// Minimal pricing engine used by the checkout/pricing page.
// This can be replaced or extended with real pricing logic later.

export interface PricingItem {
  id: string;
  name: string;
  description: string;
  price: number;
  currency: string;
  interval?: 'one_time' | 'month' | 'year';
}

export function getPricingOptions(): PricingItem[] {
  return [
    {
      id: 'starter',
      name: 'Starter Plan',
      description: 'For founders exploring funding options with one business plan.',
      price: 49,
      currency: 'EUR',
      interval: 'one_time',
    },
    {
      id: 'pro',
      name: 'Pro Plan',
      description: 'Advanced editor features and multiple export-ready plans.',
      price: 129,
      currency: 'EUR',
      interval: 'one_time',
    },
  ];
}

// Simple helper used by the checkout/pricing page. It maps the selected
// product/route combination to a concrete price, delivery time, and a list
// of additional bullet points to display.
export type PlanProduct = 'strategy' | 'review' | 'submission';

export interface PricingResult {
  basePrice: number;
  deliveryTime: string;
  includes: string[];
}

export function calculatePricing(
  product: PlanProduct,
  _route: string,
  _addonPack: boolean
): PricingResult {
  switch (product) {
    case 'strategy':
      return {
        basePrice: 0,
        deliveryTime: 'Initial strategy workshop within 3–5 business days',
        includes: [
          'One strategic funding roadmap session (online)',
          'Written summary with 3–5 concrete next steps',
          'Email follow-up with additional resources',
        ],
      };
    case 'review':
      return {
        basePrice: 49,
        deliveryTime: 'Detailed review within 5–7 business days',
        includes: [
          'Line-by-line review of your existing plan',
          'Concrete comments and improvement suggestions',
          'One revision checklist tailored to your program',
        ],
      };
    case 'submission':
    default:
      return {
        basePrice: 129,
        deliveryTime: 'Submission-ready document within 7–10 business days',
        includes: [
          'Full plan structure aligned with funding program',
          'Editorial polishing for clarity and impact',
          'Export-ready PDF and Word formats',
        ],
      };
  }
}

