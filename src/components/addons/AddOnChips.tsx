// Contextual Add-On Chips Component
import React, { useState, useEffect } from 'react';
import { UserProfile } from '@/lib/schemas/userProfile';
import paymentManager from '@/lib/payments';
import analytics from '@/lib/analytics';
import featureFlags from '@/lib/featureFlags';

interface AddOnChipsProps {
  userProfile: UserProfile;
  planId: string;
  currentSection?: string;
  onAddOnClick: (addOnId: string) => void;
}

interface AddOnChip {
  id: string;
  name: string;
  description: string;
  price: number;
  currency: string;
  icon: string;
  context: string[];
  urgency: 'LOW' | 'MEDIUM' | 'HIGH';
  popular?: boolean;
}

const ADD_ON_CHIPS: AddOnChip[] = [
  {
    id: 'team_cv',
    name: 'Team CV Builder',
    description: 'Professional team profiles for your business plan',
    price: 19,
    currency: 'EUR',
    icon: '👥',
    context: ['team_qualifications', 'executive_summary'],
    urgency: 'MEDIUM',
    popular: true
  },
  {
    id: 'application_snippets',
    name: 'Application Snippets',
    description: 'Ready-to-use grant application text',
    price: 29,
    currency: 'EUR',
    icon: '📝',
    context: ['project_description', 'executive_summary'],
    urgency: 'HIGH',
    popular: true
  },
  {
    id: 'expert_review',
    name: 'Expert Review',
    description: 'Professional review by funding expert',
    price: 99,
    currency: 'EUR',
    icon: '🔍',
    context: ['financial_plan', 'project_description'],
    urgency: 'HIGH'
  },
  {
    id: 'financial_templates',
    name: 'Financial Templates',
    description: 'Advanced financial planning templates',
    price: 39,
    currency: 'EUR',
    icon: '📊',
    context: ['financial_plan', 'financial_statements'],
    urgency: 'MEDIUM'
  },
  {
    id: 'translation',
    name: 'Translation Service',
    description: 'German translation of your business plan',
    price: 89,
    currency: 'EUR',
    icon: '🌐',
    context: ['all'],
    urgency: 'LOW'
  },
  {
    id: 'legal_consultation',
    name: 'Legal Consultation',
    description: 'Immigration law consultation',
    price: 199,
    currency: 'EUR',
    icon: '⚖️',
    context: ['visa', 'legal'],
    urgency: 'MEDIUM'
  },
  {
    id: 'bank_presentation',
    name: 'Bank Presentation',
    description: 'Professional presentation for banks',
    price: 79,
    currency: 'EUR',
    icon: '🏦',
    context: ['financial_plan', 'business_overview'],
    urgency: 'MEDIUM'
  },
  {
    id: 'application_guidance',
    name: 'Application Guidance',
    description: 'Step-by-step visa application help',
    price: 59,
    currency: 'EUR',
    icon: '🎯',
    context: ['visa', 'application'],
    urgency: 'HIGH'
  }
];

export default function AddOnChips({ userProfile, planId, currentSection, onAddOnClick }: AddOnChipsProps) {
  const [availableAddOns, setAvailableAddOns] = useState<AddOnChip[]>([]);
  const [purchasedAddOns, setPurchasedAddOns] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    loadAvailableAddOns();
    loadPurchasedAddOns();
  }, [userProfile, currentSection]);

  const loadAvailableAddOns = () => {
    const segmentAddOns = paymentManager.getAvailableAddOns(userProfile.segment);
    
    // Filter add-ons based on current context
    const contextualAddOns = ADD_ON_CHIPS.filter(addOn => {
      // Check if add-on is available for this segment
      const isAvailableForSegment = segmentAddOns.some(segmentAddOn => segmentAddOn.id === addOn.id);
      
      // Check if add-on is relevant to current section
      const isRelevantToSection = !currentSection || 
        addOn.context.includes('all') || 
        addOn.context.some(context => currentSection.includes(context));
      
      return isAvailableForSegment && isRelevantToSection;
    });

    // Sort by urgency and popularity
    contextualAddOns.sort((a, b) => {
      if (a.popular && !b.popular) return -1;
      if (!a.popular && b.popular) return 1;
      
      const urgencyOrder = { HIGH: 3, MEDIUM: 2, LOW: 1 };
      return urgencyOrder[b.urgency] - urgencyOrder[a.urgency];
    });

    setAvailableAddOns(contextualAddOns.slice(0, 4)); // Show max 4 chips
  };

  const loadPurchasedAddOns = async () => {
    // In a real implementation, this would fetch from the backend
    // For now, we'll use localStorage
    try {
      const purchased = JSON.parse(localStorage.getItem(`purchased_addons_${userProfile.id}`) || '[]');
      setPurchasedAddOns(purchased);
    } catch (error) {
      console.error('Error loading purchased add-ons:', error);
    }
  };

  const handleAddOnClick = async (addOn: AddOnChip) => {
    if (purchasedAddOns.includes(addOn.id)) {
      // Already purchased, show details or use the add-on
      onAddOnClick(addOn.id);
      return;
    }

    setIsLoading(true);
    try {
      // Track add-on interest
      await analytics.trackEvent({
        event: 'addon_interest',
        properties: {
          addOnId: addOn.id,
          addOnName: addOn.name,
          price: addOn.price,
          planId
        }
      });

      // Create payment session
      const items = [{
        id: addOn.id,
        name: addOn.name,
        description: addOn.description,
        amount: addOn.price,
        currency: addOn.currency,
        quantity: 1
      }];

      const session = await paymentManager.createPaymentSession(
        items,
        userProfile,
        `${window.location.origin}/success?addon=${addOn.id}`,
        `${window.location.origin}/editor?plan=${planId}`
      );

      if (session) {
        await paymentManager.redirectToCheckout(session.id);
      }
    } catch (error) {
      console.error('Error purchasing add-on:', error);
      // Fallback: show add-on details
      onAddOnClick(addOn.id);
    } finally {
      setIsLoading(false);
    }
  };

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case 'HIGH': return 'border-red-200 bg-red-50 text-red-800';
      case 'MEDIUM': return 'border-yellow-200 bg-yellow-50 text-yellow-800';
      case 'LOW': return 'border-blue-200 bg-blue-50 text-blue-800';
      default: return 'border-gray-200 bg-gray-50 text-gray-800';
    }
  };

  if (!featureFlags.isEnabled('ADDON_CHIPS') || availableAddOns.length === 0) {
    return null;
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 mb-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-medium text-gray-900">Recommended Add-Ons</h3>
        <span className="text-sm text-gray-500">Enhance your business plan</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {availableAddOns.map((addOn) => {
          const isPurchased = purchasedAddOns.includes(addOn.id);
          
          return (
            <button
              key={addOn.id}
              onClick={() => handleAddOnClick(addOn)}
              disabled={isLoading}
              className={`p-4 border rounded-lg text-left transition-all hover:shadow-md disabled:opacity-50 ${
                isPurchased 
                  ? 'border-green-200 bg-green-50' 
                  : getUrgencyColor(addOn.urgency)
              }`}
            >
              <div className="flex items-start space-x-3">
                <div className="text-2xl">{addOn.icon}</div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-2">
                    <h4 className="font-medium text-gray-900 truncate">{addOn.name}</h4>
                    {addOn.popular && (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-orange-100 text-orange-800">
                        Popular
                      </span>
                    )}
                    {isPurchased && (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-green-100 text-green-800">
                        ✓ Purchased
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-600 mt-1 line-clamp-2">{addOn.description}</p>
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-lg font-semibold text-gray-900">
                      {isPurchased ? 'Included' : `€${addOn.price}`}
                    </span>
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      addOn.urgency === 'HIGH' ? 'bg-red-100 text-red-800' :
                      addOn.urgency === 'MEDIUM' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-blue-100 text-blue-800'
                    }`}>
                      {addOn.urgency === 'HIGH' ? 'Recommended' : 
                       addOn.urgency === 'MEDIUM' ? 'Helpful' : 'Optional'}
                    </span>
                  </div>
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {isLoading && (
        <div className="mt-4 text-center">
          <div className="inline-flex items-center space-x-2 text-sm text-gray-600">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
            <span>Processing...</span>
          </div>
        </div>
      )}

      <div className="mt-4 text-center">
        <p className="text-xs text-gray-500">
          Add-ons are tailored to your business type and current section
        </p>
      </div>
    </div>
  );
}
