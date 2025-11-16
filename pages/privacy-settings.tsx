// Privacy Settings Page
import React, { useState, useEffect } from 'react';
import { useUser } from '@/shared/user/context/UserContext';
import analytics from '@/shared/user/analytics';

export default function PrivacySettings() {
  const { userProfile } = useUser();
  const [consentSettings, setConsentSettings] = useState({
    analytics: true,
    marketing: false,
    personalization: true,
    dataRetention: '2_years'
  });
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    // Load current consent settings
    const savedConsent = localStorage.getItem('pf_gdpr_consent');
    if (savedConsent) {
      try {
        const consent = JSON.parse(savedConsent);
        if (consent.settings) {
          setConsentSettings(consent.settings);
        }
      } catch (error) {
        console.error('Error loading consent settings:', error);
      }
    }
  }, []);

  const handleSaveSettings = async () => {
    setIsLoading(true);
    setMessage('');

    try {
      // Update consent settings
      const updatedConsent = {
        accepted: true,
        timestamp: new Date().toISOString(),
        version: '1.0',
        settings: consentSettings
      };

      localStorage.setItem('pf_gdpr_consent', JSON.stringify(updatedConsent));

      // Track settings update
      await analytics.trackEvent({
        event: 'privacy_settings_updated',
        properties: {
          settings: consentSettings,
          userId: userProfile?.id
        }
      });

      setMessage('Settings saved successfully!');
    } catch (error) {
      console.error('Error saving settings:', error);
      setMessage('Error saving settings. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteData = async () => {
    if (!confirm('Are you sure you want to delete all your data? This action cannot be undone.')) {
      return;
    }

    setIsLoading(true);
    setMessage('');

    try {
      const response = await fetch('/api/user/delete-data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: userProfile?.id,
          reason: 'user_requested'
        })
      });

      if (response.ok) {
        setMessage('Your data has been deleted successfully. You will be redirected to the home page.');
        setTimeout(() => {
          window.location.href = '/';
        }, 3000);
      } else {
        setMessage('Error deleting data. Please contact support.');
      }
    } catch (error) {
      console.error('Error deleting data:', error);
      setMessage('Error deleting data. Please contact support.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleExportData = async () => {
    setIsLoading(true);
    setMessage('');

    try {
      // In a real implementation, this would generate and download a data export
      const userData = {
        profile: userProfile,
        consent: localStorage.getItem('pf_gdpr_consent'),
        timestamp: new Date().toISOString()
      };

      const blob = new Blob([JSON.stringify(userData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `plan2fund-data-export-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      setMessage('Data export downloaded successfully!');
    } catch (error) {
      console.error('Error exporting data:', error);
      setMessage('Error exporting data. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow-sm">
          {/* Header */}
          <div className="px-6 py-4 border-b border-gray-200">
            <h1 className="text-2xl font-bold text-gray-900">Privacy Settings</h1>
            <p className="text-gray-600 mt-2">
              Manage your privacy preferences and data settings
            </p>
          </div>

          {/* Content */}
          <div className="px-6 py-6 space-y-8">
            {/* Consent Settings */}
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Data Processing Consent
              </h2>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium text-gray-900">Analytics & Performance</h3>
                    <p className="text-sm text-gray-600">
                      Allow us to collect anonymous usage data to improve our service
                    </p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={consentSettings.analytics}
                      onChange={(e) => setConsentSettings(prev => ({
                        ...prev,
                        analytics: e.target.checked
                      }))}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium text-gray-900">Personalization</h3>
                    <p className="text-sm text-gray-600">
                      Allow us to personalize your experience based on your preferences
                    </p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={consentSettings.personalization}
                      onChange={(e) => setConsentSettings(prev => ({
                        ...prev,
                        personalization: e.target.checked
                      }))}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium text-gray-900">Marketing Communications</h3>
                    <p className="text-sm text-gray-600">
                      Allow us to send you relevant updates and offers
                    </p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={consentSettings.marketing}
                      onChange={(e) => setConsentSettings(prev => ({
                        ...prev,
                        marketing: e.target.checked
                      }))}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>
              </div>
            </div>

            {/* Data Retention */}
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Data Retention
              </h2>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  How long should we keep your data?
                </label>
                <select
                  value={consentSettings.dataRetention}
                  onChange={(e) => setConsentSettings(prev => ({
                    ...prev,
                    dataRetention: e.target.value
                  }))}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="1_year">1 Year</option>
                  <option value="2_years">2 Years</option>
                  <option value="5_years">5 Years</option>
                  <option value="indefinitely">Indefinitely</option>
                </select>
              </div>
            </div>

            {/* Data Actions */}
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Data Actions
              </h2>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                  <div>
                    <h3 className="font-medium text-gray-900">Export Your Data</h3>
                    <p className="text-sm text-gray-600">
                      Download a copy of all your data
                    </p>
                  </div>
                  <button
                    onClick={handleExportData}
                    disabled={isLoading}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                  >
                    Export Data
                  </button>
                </div>

                <div className="flex items-center justify-between p-4 border border-red-200 rounded-lg bg-red-50">
                  <div>
                    <h3 className="font-medium text-red-900">Delete All Data</h3>
                    <p className="text-sm text-red-600">
                      Permanently delete all your data from our systems
                    </p>
                  </div>
                  <button
                    onClick={handleDeleteData}
                    disabled={isLoading}
                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
                  >
                    Delete Data
                  </button>
                </div>
              </div>
            </div>

            {/* Message */}
            {message && (
              <div className={`p-4 rounded-lg ${
                message.includes('Error') ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'
              }`}>
                {message}
              </div>
            )}

            {/* Save Button */}
            <div className="flex justify-end">
              <button
                onClick={handleSaveSettings}
                disabled={isLoading}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                {isLoading ? 'Saving...' : 'Save Settings'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
