import { motion as motionTokens } from './theme';

// Common animation variants
export const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.3, ease: motionTokens.easing.easeOut }
};
