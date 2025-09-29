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
        className="fixed bottom-0 left-0 right-0 z-50 bg-gradient-to-r from-blue-600 to-blue-700 shadow-lg border-t border-blue-500"
      >
        <div className="max-w-6xl mx-auto px-4 py-3">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex-1 text-center sm:text-left">
              <p className="text-sm font-medium text-white mb-1">
                {t('banner.title')}
              </p>
              <div className="flex flex-wrap justify-center sm:justify-start gap-2">
                <button
                  onClick={() => handleTargetGroupClick('startups')}
                  className="px-4 py-2 text-xs bg-white/20 hover:bg-white/30 text-white rounded-full transition-all duration-200 backdrop-blur-sm border border-white/30"
                >
                  {t('banner.startups')}
                </button>
                <button
                  onClick={() => handleTargetGroupClick('smes')}
                  className="px-4 py-2 text-xs bg-white/20 hover:bg-white/30 text-white rounded-full transition-all duration-200 backdrop-blur-sm border border-white/30"
                >
                  {t('banner.smes')}
                </button>
                <button
                  onClick={() => handleTargetGroupClick('advisors')}
                  className="px-4 py-2 text-xs bg-white/20 hover:bg-white/30 text-white rounded-full transition-all duration-200 backdrop-blur-sm border border-white/30"
                >
                  {t('banner.advisors')}
                </button>
                <button
                  onClick={() => handleTargetGroupClick('universities')}
                  className="px-4 py-2 text-xs bg-white/20 hover:bg-white/30 text-white rounded-full transition-all duration-200 backdrop-blur-sm border border-white/30"
                >
                  {t('banner.universities')}
                </button>
              </div>
            </div>
            <button
              onClick={handleDismiss}
              className="text-white/80 hover:text-white transition-colors duration-200 p-2 hover:bg-white/10 rounded-full"
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
