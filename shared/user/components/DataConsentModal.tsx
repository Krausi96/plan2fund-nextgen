/**
 * Data Consent Modal
 * Requests user consent for data collection and ML training
 */

'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { X, Shield, Database, Brain } from 'lucide-react';
import { Button } from '@/shared/components/ui/button';
import { Card } from '@/shared/components/ui/card';
import { setUserConsent, getUserConsent } from '@/shared/user/analytics/analytics';
import { useUser } from '@/shared/user/context/UserContext';

interface DataConsentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConsentChange?: (consented: boolean) => void;
}

export default function DataConsentModal({
  isOpen,
  onClose,
  onConsentChange
}: DataConsentModalProps) {
  const { userProfile } = useUser();
  const [dataCollection, setDataCollection] = useState(false);
  const [mlTraining, setMlTraining] = useState(false);
  const [loading, setLoading] = useState(false);

  const loadConsentStatus = useCallback(async () => {
    if (!userProfile?.id) return;
    
    try {
      const consent = await getUserConsent(userProfile.id);
      setDataCollection(consent);
      setMlTraining(consent); // Default to same for both
    } catch (error) {
      console.error('Error loading consent:', error);
    }
  }, [userProfile]);

  useEffect(() => {
    if (isOpen && userProfile?.id) {
      loadConsentStatus();
    }
  }, [isOpen, userProfile, loadConsentStatus]);

  const handleSave = async () => {
    if (!userProfile?.id) return;

    setLoading(true);
    try {
      await setUserConsent(userProfile.id, dataCollection, 'data_collection');
      await setUserConsent(userProfile.id, mlTraining, 'ml_training');
      
      if (onConsentChange) {
        onConsentChange(dataCollection || mlTraining);
      }
      
      onClose();
    } catch (error) {
      console.error('Error saving consent:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <Card className="w-full max-w-2xl mx-4 p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Shield className="h-6 w-6 text-blue-600" />
            <h2 className="text-xl font-semibold text-gray-900">
              Datenschutz-Einstellungen
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-4 mb-6">
          <p className="text-sm text-gray-600">
            Wir sammeln anonymisierte Daten, um unsere Dienste zu verbessern und 
            KI-Modelle zu trainieren. Ihre persönlichen Daten werden dabei nicht 
            gespeichert.
          </p>

          <div className="space-y-4">
            {/* Data Collection */}
            <div className="flex items-start gap-3 p-4 border border-gray-200 rounded-lg">
              <input
                type="checkbox"
                checked={dataCollection}
                onChange={(e) => setDataCollection(e.target.checked)}
                className="mt-1 h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <Database className="h-4 w-4 text-gray-600" />
                  <label className="font-medium text-gray-900 cursor-pointer">
                    Anonymisierte Datensammlung
                  </label>
                </div>
                <p className="text-xs text-gray-600">
                  Erlauben Sie uns, anonymisierte Daten über Ihre Nutzung zu sammeln, 
                  um die Benutzerfreundlichkeit zu verbessern.
                </p>
              </div>
            </div>

            {/* ML Training */}
            <div className="flex items-start gap-3 p-4 border border-gray-200 rounded-lg">
              <input
                type="checkbox"
                checked={mlTraining}
                onChange={(e) => setMlTraining(e.target.checked)}
                className="mt-1 h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <Brain className="h-4 w-4 text-gray-600" />
                  <label className="font-medium text-gray-900 cursor-pointer">
                    KI-Modell Training
                  </label>
                </div>
                <p className="text-xs text-gray-600">
                  Erlauben Sie uns, anonymisierte Geschäftspläne für das Training 
                  von KI-Modellen zu verwenden, um bessere Empfehlungen zu geben.
                </p>
              </div>
            </div>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-xs text-blue-800">
              <strong>Ihre Rechte:</strong> Sie können Ihre Einwilligung jederzeit 
              widerrufen. Alle Daten werden anonymisiert und enthalten keine 
              persönlich identifizierbaren Informationen.
            </p>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={loading}
          >
            Abbrechen
          </Button>
          <Button
            onClick={handleSave}
            disabled={loading}
          >
            {loading ? 'Speichern...' : 'Speichern'}
          </Button>
        </div>
      </Card>
    </div>
  );
}

