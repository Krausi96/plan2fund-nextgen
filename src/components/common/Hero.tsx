import { motion } from "framer-motion";
import { useState, useEffect, memo } from "react";
import { ClipboardList, BarChart2, LineChart, FileText, Target, Briefcase, Users, DollarSign, PieChart, Presentation, TrendingUp, type LucideIcon } from "lucide-react";
import { useI18n } from "@/contexts/I18nContext";

const icons = [
  ClipboardList, BarChart2, LineChart, FileText, Target,
  Briefcase, Users, DollarSign, PieChart, Presentation, TrendingUp
];

const FloatingIcon = memo(function FloatingIcon({ Icon, index }: { Icon: LucideIcon; index: number }) {
  const driftX = (index % 2 === 0 ? 1 : -1) * (40 + index * 5);
  const driftY = (index % 2 === 0 ? -1 : 1) * (30 + index * 3);

  return (
    <motion.div
      className="absolute opacity-15"
      initial={{ x: 0, y: 0, opacity: 0 }}
      animate={{
        x: [0, driftX, 0],
        y: [0, driftY, 0],
        opacity: [0.1, 0.3, 0.1],
        scale: [1, 1.05, 1]
      }}
      transition={{
        repeat: Infinity,
        duration: 14 + index * 2,
        ease: "easeInOut"
      }}
      style={{
        top: `${Math.random() * 80 + 5}%`,
        left: `${Math.random() * 80 + 10}%`
      }}
    >
      <Icon size={42} className="text-blue-400" />
    </motion.div>
  );
});

const ProgramCounter = memo(function ProgramCounter() {
  const [count, setCount] = useState(0);
  const targetCount = 214;

  useEffect(() => {
    const timer = setTimeout(() => {
      const increment = targetCount / 50;
      if (count < targetCount) {
        setCount(prev => Math.min(prev + increment, targetCount));
      }
    }, 50);
    return () => clearTimeout(timer);
  }, [count, targetCount]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.5 }}
      className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20"
    >
      <div className="text-center">
        <div className="text-4xl font-bold text-white mb-2">
          {Math.floor(count)}+
        </div>
        <div className="text-lg text-blue-200 mb-2">
          programs live in Austria/EU
        </div>
        <div className="text-sm text-gray-300">
          How many do you qualify for?
        </div>
      </div>
    </motion.div>
  );
});

interface HeroProps {
  title?: string;
  subtitle?: string;
  primaryButtonText?: string;
  primaryButtonHref?: string;
  secondaryButtonText?: string;
  secondaryButtonHref?: string;
  trustText?: string;
}

export function Hero({
  title,
  subtitle,
  primaryButtonText,
  primaryButtonHref = "/editor",
  secondaryButtonText,
  secondaryButtonHref = "/reco",
  trustText
}: HeroProps = {}) {
  const { t } = useI18n();
  
  const heroTitle = title || t('hero.title');
  const heroSubtitle = subtitle || t('hero.subtitle');
  const heroPrimaryButton = primaryButtonText || t('hero.startPlan');
  const heroSecondaryButton = secondaryButtonText || t('hero.quickSearch');
  const heroTrustText = trustText || t('hero.trust');

  return (
    <section 
      className="relative min-h-[100vh] sm:min-h-[80vh] flex items-center justify-center overflow-hidden bg-gradient-to-b from-neutral-800 via-neutral-900 to-black"
      aria-label="Hero section with main value proposition"
    >
      {/* Radial Glow */}
      <div className="absolute w-[1000px] h-[1000px] rounded-full bg-primary opacity-10 blur-3xl"></div>

      {/* Floating Icons */}
      {icons.map((Icon, i) => (
        <FloatingIcon Icon={Icon} index={i} key={i} />
      ))}

      {/* Central Content */}
      <div className="relative z-20 text-center max-w-4xl px-4 sm:px-6">
        <motion.h1 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="hero-title-mobile font-extrabold text-white leading-tight mb-4"
        >
          {heroTitle}
        </motion.h1>
        
        <motion.p 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.8 }}
          className="hero-subtitle-mobile text-neutral-300 mb-8 max-w-2xl mx-auto"
        >
          {heroSubtitle}
        </motion.p>

        {/* Interactive Counter Widget */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.6, duration: 0.8 }}
          className="mb-8 flex justify-center"
        >
          <ProgramCounter />
        </motion.div>

        {/* CTA Buttons */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.9, duration: 0.8 }}
          className="flex flex-col sm:flex-row justify-center gap-4 flex-wrap cta-mobile"
        >
          <a
            href={primaryButtonHref}
            className="w-full sm:w-auto px-6 sm:px-8 py-3 sm:py-4 bg-blue-600 text-white rounded-xl shadow-lg hover:bg-blue-700 transition-all duration-300 font-semibold text-base sm:text-lg hover:shadow-xl hover:scale-105 touch-target will-change-transform"
          >
            {heroPrimaryButton}
          </a>
          <a
            href={secondaryButtonHref}
            className="w-full sm:w-auto px-6 sm:px-8 py-3 sm:py-4 bg-white/10 backdrop-blur-sm text-white rounded-xl border border-white/20 hover:bg-white/20 transition-all duration-300 font-semibold text-base sm:text-lg touch-target will-change-transform"
          >
            {heroSecondaryButton}
          </a>
        </motion.div>

        {/* Trust indicators */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.2, duration: 0.8 }}
          className="mt-8 sm:mt-12 text-sm text-gray-400"
        >
          {heroTrustText}
        </motion.div>
      </div>
    </section>
  );
}
