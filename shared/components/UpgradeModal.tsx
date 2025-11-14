/**
 * UpgradeModal - Modal for prompting users to upgrade to premium
 * Shows when user tries to access a premium feature
 */

import React from 'react';
import { X, Sparkles, Check, ArrowRight } from 'lucide-react';
import { Button } from '@/shared/components/ui/button';
import { Card } from '@/shared/components/ui/card';
import { 
  FeatureFlag, 
  getFeatureName, 
  getFeatureDescription,
  getPremiumFeatures 
} from '@/shared/user/featureFlags';

interface UpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  feature?: FeatureFlag;
  onUpgrade?: () => void;
}

export default function UpgradeModal({
  isOpen,
  onClose,
  feature,
  onUpgrade
}: UpgradeModalProps) {
  if (!isOpen) return null;

  const premiumFeatures = getPremiumFeatures();
  const featureName = feature ? getFeatureName(feature) : 'Premium Features';
  const featureDescription = feature ? getFeatureDescription(feature) : '';

  const handleUpgrade = () => {
    if (onUpgrade) {
      onUpgrade();
    } else {
      // Default: redirect to pricing page
      window.location.href = '/pricing';
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg">
              <Sparkles className="h-6 w-6 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Upgrade to Premium</h2>
              <p className="text-sm text-gray-500">Unlock powerful features</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Feature-specific message */}
          {feature && (
            <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <h3 className="font-semibold text-blue-900 mb-1">{featureName}</h3>
              <p className="text-sm text-blue-800">{featureDescription}</p>
              <p className="text-sm text-blue-700 mt-2">
                This feature requires a Premium subscription.
              </p>
            </div>
          )}

          {/* Premium Features List */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              What you get with Premium:
            </h3>
            <div className="space-y-3">
              {premiumFeatures.map((feat) => (
                <div
                  key={feat}
                  className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg"
                >
                  <Check className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-medium text-gray-900">
                      {getFeatureName(feat)}
                    </p>
                    <p className="text-sm text-gray-600">
                      {getFeatureDescription(feat)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Pricing Card */}
          <Card className="p-6 bg-gradient-to-br from-blue-50 to-purple-50 border-2 border-blue-200">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-2xl font-bold text-gray-900">Premium</h3>
                <p className="text-sm text-gray-600">All features included</p>
              </div>
              <div className="text-right">
                <div className="text-3xl font-bold text-gray-900">€29</div>
                <div className="text-sm text-gray-600">per month</div>
              </div>
            </div>
            <ul className="space-y-2 mb-6">
              <li className="flex items-center gap-2 text-sm text-gray-700">
                <Check className="h-4 w-4 text-green-600" />
                Unlimited business plans
              </li>
              <li className="flex items-center gap-2 text-sm text-gray-700">
                <Check className="h-4 w-4 text-green-600" />
                AI-powered semantic search
              </li>
              <li className="flex items-center gap-2 text-sm text-gray-700">
                <Check className="h-4 w-4 text-green-600" />
                Advanced AI assistant
              </li>
              <li className="flex items-center gap-2 text-sm text-gray-700">
                <Check className="h-4 w-4 text-green-600" />
                PDF export without watermark
              </li>
              <li className="flex items-center gap-2 text-sm text-gray-700">
                <Check className="h-4 w-4 text-green-600" />
                Additional documents editor
              </li>
            </ul>
          </Card>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200 bg-gray-50">
          <Button
            onClick={onClose}
            variant="outline"
            size="lg"
          >
            Maybe Later
          </Button>
          <Button
            onClick={handleUpgrade}
            size="lg"
            className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
          >
            Upgrade to Premium
            <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
        </div>
      </div>
    </div>
  );
}

