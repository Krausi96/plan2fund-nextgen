// GDPR Consent Banner Component
import React, { useState, useEffect } from 'react';
import analytics from '@/lib/analytics';

interface ConsentBannerProps {
  onAccept: () => void;
  onDecline: () => void;
}

export default function ConsentBanner({ onAccept, onDecline }: ConsentBannerProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // Check if user has already given consent
    const hasConsent = localStorage.getItem('pf_gdpr_consent');
    if (!hasConsent) {
      setIsVisible(true);
    }
  }, []);

  const handleAccept = async () => {
    setIsLoading(true);
    try {
      // Store consent
      localStorage.setItem('pf_gdpr_consent', JSON.stringify({
        accepted: true,
        timestamp: new Date().toISOString(),
        version: '1.0'
      }));

      // Track consent acceptance
      await analytics.trackEvent({
        event: 'gdpr_consent_accepted',
        properties: {
          timestamp: new Date().toISOString(),
          version: '1.0'
        }
      });

      setIsVisible(false);
      onAccept();
    } catch (error) {
      console.error('Error accepting consent:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDecline = async () => {
    setIsLoading(true);
    try {
      // Store consent decline
      localStorage.setItem('pf_gdpr_consent', JSON.stringify({
        accepted: false,
        timestamp: new Date().toISOString(),
        version: '1.0'
      }));

      // Track consent decline
      await analytics.trackEvent({
        event: 'gdpr_consent_declined',
        properties: {
          timestamp: new Date().toISOString(),
          version: '1.0'
        }
      });

      setIsVisible(false);
      onDecline();
    } catch (error) {
      console.error('Error declining consent:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleManagePreferences = () => {
    // Open privacy settings modal or page
    window.open('/privacy-settings', '_blank');
  };

  if (!isVisible) {
    return null;
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg z-50">
      <div className="max-w-7xl mx-auto px-4 py-4">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between space-y-4 md:space-y-0">
          {/* Content */}
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Privacy & Cookies
            </h3>
            <p className="text-sm text-gray-600 mb-4 md:mb-0">
              We use cookies and analytics to improve your experience and provide personalized recommendations. 
              By continuing to use our service, you consent to our use of cookies and data processing as described in our{' '}
              <a 
                href="/privacy-policy" 
                className="text-blue-600 hover:text-blue-700 underline"
                target="_blank"
                rel="noopener noreferrer"
              >
                Privacy Policy
              </a>
              {' '}and{' '}
              <a 
                href="/terms-of-service" 
                className="text-blue-600 hover:text-blue-700 underline"
                target="_blank"
                rel="noopener noreferrer"
              >
                Terms of Service
              </a>
              .
            </p>
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3">
            <button
              onClick={handleManagePreferences}
              className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 underline"
            >
              Manage Preferences
            </button>
            
            <button
              onClick={handleDecline}
              disabled={isLoading}
              className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
            >
              {isLoading ? 'Processing...' : 'Decline'}
            </button>
            
            <button
              onClick={handleAccept}
              disabled={isLoading}
              className="px-6 py-2 text-sm text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {isLoading ? 'Processing...' : 'Accept All'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
