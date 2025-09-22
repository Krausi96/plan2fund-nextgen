import { motion } from 'framer-motion';
import { motion as motionTokens } from './theme';

// Common animation variants
export const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.3, ease: motionTokens.easing.easeOut }
};

export const fadeIn = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  transition: { duration: 0.3, ease: motionTokens.easing.easeOut }
};

export const scaleIn = {
  initial: { opacity: 0, scale: 0.95 },
  animate: { opacity: 1, scale: 1 },
  transition: { duration: 0.2, ease: motionTokens.easing.easeOut }
};

export const staggerContainer = {
  animate: {
    transition: {
      staggerChildren: 0.1
    }
  }
};

export const staggerItem = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 }
};

// Hover animations
export const hoverScale = {
  whileHover: { scale: 1.02 },
  whileTap: { scale: 0.98 },
  transition: { duration: 0.2, ease: motionTokens.easing.easeOut }
};

export const hoverLift = {
  whileHover: { y: -4, boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)' },
  transition: { duration: 0.2, ease: motionTokens.easing.easeOut }
};

// Reduced motion variants
export const reducedMotion = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  transition: { duration: 0.1 }
};

// Check for reduced motion preference
export const getMotionVariants = (variants: any) => {
  if (typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    return reducedMotion;
  }
  return variants;
};

// Motion wrapper component
export const MotionDiv = motion.div;
export const MotionSection = motion.section;
export const MotionH1 = motion.h1;
export const MotionH2 = motion.h2;
export const MotionH3 = motion.h3;
export const MotionP = motion.p;
export const MotionButton = motion.button;
