// ========= PLAN2FUND — TARGET GROUP BANNER =========
// Fallback banner for target group selection when automatic detection fails

import React, { useState, useEffect } from 'react';
import { useI18n } from '@/contexts/I18nContext';
import { motion, AnimatePresence } from 'framer-motion';
import { storeTargetGroupSelection, detectTargetGroup } from '@/lib/targetGroupDetection';

interface TargetGroupBannerProps {
  onTargetGroupSelect?: (targetGroup: string) => void;
}

export default function TargetGroupBanner({ onTargetGroupSelect }: TargetGroupBannerProps) {
  const { t } = useI18n();
  const [showBanner, setShowBanner] = useState(false);

  useEffect(() => {
    // Check if user has already made a selection (stored in localStorage)
    const hasSelectedTargetGroup = localStorage.getItem('selectedTargetGroup');
    const detection = detectTargetGroup();
    
    // Only show banner if:
    // 1. No target group is stored in localStorage
    // 2. Detection failed (targetGroup is 'default')
    // 3. User is on landing page (not /for/* pages)
    if (!hasSelectedTargetGroup && detection.targetGroup === 'default' && window.location.pathname === '/') {
      setShowBanner(true);
    }
  }, []);

  const handleTargetGroupClick = (targetGroup: string, event?: React.MouseEvent) => {
    // Prevent any default behavior
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }
    
    // Store selection using the detection utility
    storeTargetGroupSelection(targetGroup as any);
    
    // Hide banner
    setShowBanner(false);
    
    // Notify parent component to update Hero content
    if (onTargetGroupSelect) {
      onTargetGroupSelect(targetGroup);
    }
  };

  const handleDismiss = () => {
    setShowBanner(false);
  };

  if (!showBanner) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 20 }}
        transition={{ duration: 0.3 }}
        className="fixed bottom-6 left-4 right-4 z-50 bg-white/95 backdrop-blur-sm shadow-lg border border-gray-200 rounded-lg max-w-2xl mx-auto"
      >
        <div className="px-6 py-4">
          <div className="flex items-center justify-between gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <p className="text-sm font-semibold text-gray-800">
                  {t('banner.title')}
                </p>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={(e) => handleTargetGroupClick('startups', e)}
                  className="flex items-center gap-2 px-4 py-2.5 text-sm bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-lg transition-all duration-200 font-medium hover:shadow-md"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  {t('banner.startups')}
                </button>
                <button
                  type="button"
                  onClick={(e) => handleTargetGroupClick('smes', e)}
                  className="flex items-center gap-2 px-4 py-2.5 text-sm bg-green-50 hover:bg-green-100 text-green-700 border border-green-200 rounded-lg transition-all duration-200 font-medium hover:shadow-md"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                  {t('banner.smes')}
                </button>
                <button
                  type="button"
                  onClick={(e) => handleTargetGroupClick('advisors', e)}
                  className="flex items-center gap-2 px-4 py-2.5 text-sm bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 rounded-lg transition-all duration-200 font-medium hover:shadow-md"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                  {t('banner.advisors')}
                </button>
                <button
                  type="button"
                  onClick={(e) => handleTargetGroupClick('universities', e)}
                  className="flex items-center gap-2 px-4 py-2.5 text-sm bg-orange-50 hover:bg-orange-100 text-orange-700 border border-orange-200 rounded-lg transition-all duration-200 font-medium hover:shadow-md"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l9-5-9-5-9 5 9 5z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
                  </svg>
                  {t('banner.universities')}
                </button>
              </div>
            </div>
            <button
              type="button"
              onClick={handleDismiss}
              className="text-gray-400 hover:text-gray-600 transition-colors duration-200 p-2 hover:bg-gray-100 rounded-lg"
              aria-label="Dismiss banner"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
