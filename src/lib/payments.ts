// Stripe Payment Integration
import { UserProfile } from './schemas/userProfile';
// import analytics from './analytics';
import featureFlags from './featureFlags';

export interface PaymentItem {
  id: string;
  name: string;
  description: string;
  amount: number;
  currency: string;
  quantity: number;
}

export interface PaymentSession {
  id: string;
  url: string;
  amount: number;
  currency: string;
  status: 'pending' | 'completed' | 'failed' | 'cancelled';
}

export interface PricingTier {
  id: string;
  name: string;
  description: string;
  price: number;
  currency: string;
  features: string[];
  popular?: boolean;
}

class PaymentManager {
  private stripe: any = null;
  private isInitialized = false;
  private testMode = false;

  async initialize(): Promise<void> {
    if (typeof window === 'undefined' || this.isInitialized) return;

    // Check if we're in test mode (no Stripe key)
    if (!process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY) {
      console.log('🧪 Payment Test Mode: No Stripe key found, using mock payments');
      this.testMode = true;
      this.isInitialized = true;
      return;
    }

    try {
      // Load Stripe.js dynamically
      const { loadStripe } = await import('@stripe/stripe-js');
      this.stripe = await loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);
      this.isInitialized = true;
    } catch (error) {
      console.error('Failed to initialize Stripe:', error);
      // Fallback to test mode if Stripe fails
      this.testMode = true;
      this.isInitialized = true;
    }
  }

  // Get pricing tiers based on user segment
  getPricingTiers(userSegment: string): PricingTier[] {
    const baseTiers = {
      B2C_FOUNDER: [
        {
          id: 'draft',
          name: 'Draft Export',
          description: 'Basic PDF with watermark',
          price: 0,
          currency: 'EUR',
          features: ['PDF export', 'Watermark', 'Basic formatting']
        },
        {
          id: 'standard',
          name: 'Standard Export',
          description: 'Professional PDF without watermark',
          price: 29,
          currency: 'EUR',
          features: ['PDF export', 'No watermark', 'Professional formatting', 'Email support'],
          popular: true
        },
        {
          id: 'premium',
          name: 'Premium Export',
          description: 'Full package with add-ons',
          price: 49,
          currency: 'EUR',
          features: ['PDF + DOCX export', 'No watermark', 'Premium formatting', 'Priority support', 'Team CV builder', 'Application snippets']
        }
      ],
      SME_LOAN: [
        {
          id: 'draft',
          name: 'Draft Export',
          description: 'Basic PDF with watermark',
          price: 0,
          currency: 'EUR',
          features: ['PDF export', 'Watermark', 'Basic formatting']
        },
        {
          id: 'standard',
          name: 'Business Package',
          description: 'Professional business plan export',
          price: 99,
          currency: 'EUR',
          features: ['PDF export', 'No watermark', 'Professional formatting', 'Financial templates', 'Email support'],
          popular: true
        },
        {
          id: 'premium',
          name: 'Enterprise Package',
          description: 'Complete business planning solution',
          price: 149,
          currency: 'EUR',
          features: ['PDF + DOCX export', 'No watermark', 'Premium formatting', 'Priority support', 'Expert review', 'Translation service', 'Team CV builder']
        }
      ],
      VISA: [
        {
          id: 'draft',
          name: 'Draft Export',
          description: 'Basic PDF with watermark',
          price: 0,
          currency: 'EUR',
          features: ['PDF export', 'Watermark', 'Basic formatting']
        },
        {
          id: 'standard',
          name: 'Visa Package',
          description: 'Austrian visa business plan',
          price: 79,
          currency: 'EUR',
          features: ['PDF export', 'No watermark', 'Visa-specific formatting', 'Austria integration guide', 'Email support'],
          popular: true
        },
        {
          id: 'premium',
          name: 'Complete Visa Solution',
          description: 'Full visa application support',
          price: 129,
          currency: 'EUR',
          features: ['PDF + DOCX export', 'No watermark', 'Premium formatting', 'Priority support', 'Legal review', 'Translation service', 'Application guidance']
        }
      ],
      PARTNER: [
        {
          id: 'free',
          name: 'Partner Access',
          description: 'Free access for partners',
          price: 0,
          currency: 'EUR',
          features: ['All exports free', 'No watermarks', 'Priority support', 'White-label options']
        }
      ]
    };

    return baseTiers[userSegment as keyof typeof baseTiers] || baseTiers.B2C_FOUNDER;
  }

  // Create payment session
  async createPaymentSession(
    items: PaymentItem[],
    userProfile: UserProfile,
    successUrl: string,
    cancelUrl: string
  ): Promise<PaymentSession | null> {
    if (!featureFlags.isEnabled('PAYMENT_INTEGRATION')) {
      throw new Error('Payment integration not enabled');
    }

    await this.initialize();
    
    // Test mode: return mock payment session
    if (this.testMode) {
      console.log('🧪 Payment Test Mode: Creating mock payment session');
      return {
        id: 'mock_session_' + Date.now(),
        url: successUrl + '?mock=true&session_id=mock_session_' + Date.now(),
        amount: items.reduce((sum, item) => sum + (item.amount * item.quantity), 0),
        currency: 'EUR',
        status: 'pending'
      };
    }

    if (!this.stripe) {
      throw new Error('Stripe not initialized');
    }

    try {
      // Track payment start
      // const totalAmount = items.reduce((sum, item) => sum + (item.amount * item.quantity), 0);
      // await analytics.trackPaymentStart(totalAmount, 'EUR', userProfile.id);

      // Create checkout session on server
      const response = await fetch('/api/payments/create-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items,
          userId: userProfile.id,
          userSegment: userProfile.segment,
          successUrl,
          cancelUrl
        })
      });

      if (!response.ok) {
        throw new Error('Failed to create payment session');
      }

      const session = await response.json();
      return session;
    } catch (error) {
      console.error('Error creating payment session:', error);
      throw error;
    }
  }

  // Redirect to Stripe Checkout
  async redirectToCheckout(sessionId: string): Promise<void> {
    await this.initialize();
    if (!this.stripe) {
      throw new Error('Stripe not initialized');
    }

    const { error } = await this.stripe.redirectToCheckout({ sessionId });
    if (error) {
      throw new Error(error.message);
    }
  }

  // Handle successful payment
  async handlePaymentSuccess(sessionId: string): Promise<void> {
    try {
      const response = await fetch('/api/payments/success', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId })
      });

      if (!response.ok) {
        throw new Error('Failed to process payment success');
      }

      // const data = await response.json();
      
      // Track payment completion
      // await analytics.trackPaymentComplete(
      //   data.amount,
      //   data.currency,
      //   data.planId,
      //   data.paymentMethod
      // );
    } catch (error) {
      console.error('Error handling payment success:', error);
      throw error;
    }
  }

  // Get payment history for user
  async getPaymentHistory(userId: string): Promise<any[]> {
    try {
      const response = await fetch(`/api/payments/history?userId=${userId}`);
      if (!response.ok) {
        throw new Error('Failed to fetch payment history');
      }
      return await response.json();
    } catch (error) {
      console.error('Error fetching payment history:', error);
      return [];
    }
  }

  // Check if user has active subscription
  async hasActiveSubscription(userId: string): Promise<boolean> {
    try {
      const response = await fetch(`/api/payments/subscription?userId=${userId}`);
      if (!response.ok) {
        return false;
      }
      const data = await response.json();
      return data.hasActiveSubscription || false;
    } catch (error) {
      console.error('Error checking subscription:', error);
      return false;
    }
  }

  // Create add-on purchase
  async purchaseAddOn(
    addOnType: string,
    amount: number,
    planId: string,
    userProfile: UserProfile
  ): Promise<boolean> {
    try {
      const response = await fetch('/api/payments/addon', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          addOnType,
          amount,
          planId,
          userId: userProfile.id,
          userSegment: userProfile.segment
        })
      });

      if (!response.ok) {
        throw new Error('Failed to purchase add-on');
      }

      // Track add-on purchase
      // await analytics.trackAddOnPurchase(addOnType, amount, planId);
      return true;
    } catch (error) {
      console.error('Error purchasing add-on:', error);
      return false;
    }
  }

  // Get available add-ons based on user segment
  getAvailableAddOns(userSegment: string): Array<{
    id: string;
    name: string;
    description: string;
    price: number;
    currency: string;
  }> {
    const addOns = {
      B2C_FOUNDER: [
        { id: 'team_cv', name: 'Team CV Builder', description: 'Professional team profiles', price: 19, currency: 'EUR' },
        { id: 'application_snippets', name: 'Application Snippets', description: 'Ready-to-use grant application text', price: 29, currency: 'EUR' },
        { id: 'expert_review', name: 'Expert Review', description: 'Professional review by funding expert', price: 99, currency: 'EUR' }
      ],
      SME_LOAN: [
        { id: 'financial_templates', name: 'Financial Templates', description: 'Advanced financial planning templates', price: 39, currency: 'EUR' },
        { id: 'legal_review', name: 'Legal Review', description: 'Legal compliance check', price: 149, currency: 'EUR' },
        { id: 'bank_presentation', name: 'Bank Presentation', description: 'Professional presentation for banks', price: 79, currency: 'EUR' }
      ],
      VISA: [
        { id: 'translation', name: 'Translation Service', description: 'German translation of business plan', price: 89, currency: 'EUR' },
        { id: 'legal_consultation', name: 'Legal Consultation', description: 'Immigration law consultation', price: 199, currency: 'EUR' },
        { id: 'application_guidance', name: 'Application Guidance', description: 'Step-by-step visa application help', price: 59, currency: 'EUR' }
      ],
      PARTNER: []
    };

    return addOns[userSegment as keyof typeof addOns] || [];
  }
}

export const paymentManager = new PaymentManager();
export default paymentManager;
