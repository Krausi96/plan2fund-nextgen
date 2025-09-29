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

  const handleTargetGroupClick = (targetGroup: string) => {
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
        className="fixed bottom-6 left-4 right-4 z-50 bg-gradient-to-r from-slate-800 to-slate-900 backdrop-blur-sm shadow-2xl border border-slate-700 rounded-xl max-w-3xl mx-auto"
      >
        <div className="px-6 py-4">
          <div className="flex items-center justify-between gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
                <p className="text-sm font-semibold text-white">
                  {t('banner.title')}
                </p>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => handleTargetGroupClick('startups')}
                  className="flex items-center gap-2 px-4 py-2.5 text-sm bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white rounded-lg transition-all duration-200 font-medium shadow-lg hover:shadow-xl transform hover:scale-105"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  {t('banner.startups')}
                </button>
                <button
                  onClick={() => handleTargetGroupClick('smes')}
                  className="flex items-center gap-2 px-4 py-2.5 text-sm bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white rounded-lg transition-all duration-200 font-medium shadow-lg hover:shadow-xl transform hover:scale-105"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                  {t('banner.smes')}
                </button>
                <button
                  onClick={() => handleTargetGroupClick('advisors')}
                  className="flex items-center gap-2 px-4 py-2.5 text-sm bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white rounded-lg transition-all duration-200 font-medium shadow-lg hover:shadow-xl transform hover:scale-105"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                  {t('banner.advisors')}
                </button>
                <button
                  onClick={() => handleTargetGroupClick('universities')}
                  className="flex items-center gap-2 px-4 py-2.5 text-sm bg-gradient-to-r from-orange-600 to-orange-700 hover:from-orange-700 hover:to-orange-800 text-white rounded-lg transition-all duration-200 font-medium shadow-lg hover:shadow-xl transform hover:scale-105"
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
              onClick={handleDismiss}
              className="text-slate-400 hover:text-white transition-colors duration-200 p-2 hover:bg-slate-700 rounded-lg"
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
