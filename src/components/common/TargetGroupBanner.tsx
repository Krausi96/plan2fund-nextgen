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
    
    // Notify parent component
    if (onTargetGroupSelect) {
      onTargetGroupSelect(targetGroup);
    }
    
    // Navigate to target group specific page
    window.location.href = `/for/${targetGroup}`;
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
        className="fixed bottom-4 left-4 right-4 z-50 bg-white/95 backdrop-blur-sm shadow-xl border border-gray-200 rounded-lg max-w-2xl mx-auto"
      >
        <div className="px-4 py-3">
          <div className="flex items-center justify-between gap-3">
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-900 mb-2">
                {t('banner.title')}
              </p>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => handleTargetGroupClick('startups')}
                  className="px-3 py-1.5 text-xs bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors duration-200 font-medium"
                >
                  {t('banner.startups')}
                </button>
                <button
                  onClick={() => handleTargetGroupClick('smes')}
                  className="px-3 py-1.5 text-xs bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors duration-200 font-medium"
                >
                  {t('banner.smes')}
                </button>
                <button
                  onClick={() => handleTargetGroupClick('advisors')}
                  className="px-3 py-1.5 text-xs bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors duration-200 font-medium"
                >
                  {t('banner.advisors')}
                </button>
                <button
                  onClick={() => handleTargetGroupClick('universities')}
                  className="px-3 py-1.5 text-xs bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors duration-200 font-medium"
                >
                  {t('banner.universities')}
                </button>
              </div>
            </div>
            <button
              onClick={handleDismiss}
              className="text-gray-400 hover:text-gray-600 transition-colors duration-200 p-1"
              aria-label="Dismiss banner"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
