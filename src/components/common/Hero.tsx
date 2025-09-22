import { motion, useReducedMotion } from "framer-motion";
import { useState, useEffect, memo } from "react";
import { ClipboardList, BarChart2, LineChart, FileText, Target, Briefcase, Users, DollarSign, PieChart, Presentation, TrendingUp, type LucideIcon } from "lucide-react";
import { useI18n } from "@/contexts/I18nContext";

const icons = [
  ClipboardList, BarChart2, LineChart, FileText, Target,
  Briefcase, Users, DollarSign, PieChart, Presentation, TrendingUp
];

const FloatingIcon = memo(function FloatingIcon({ Icon, index }: { Icon: LucideIcon; index: number }) {
  const shouldReduceMotion = useReducedMotion();
  const driftX = (index % 2 === 0 ? 1 : -1) * (40 + index * 5);
  const driftY = (index % 2 === 0 ? -1 : 1) * (30 + index * 3);

  return (
    <motion.div
      className="absolute opacity-15"
      initial={{ x: 0, y: 0, opacity: 0 }}
      animate={shouldReduceMotion ? { opacity: 0.1 } : {
        x: [0, driftX, 0],
        y: [0, driftY, 0],
        opacity: [0.1, 0.3, 0.1],
        scale: [1, 1.05, 1]
      }}
      transition={shouldReduceMotion ? { duration: 0.1 } : {
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
  const [hasAnimated, setHasAnimated] = useState(false);
  const targetCount = 214;
  const shouldReduceMotion = useReducedMotion();

  useEffect(() => {
    if (hasAnimated) return;
    
    const timer = setTimeout(() => {
      const increment = targetCount / 50;
      if (count < targetCount) {
        setCount(prev => Math.min(prev + increment, targetCount));
      } else {
        setHasAnimated(true);
      }
    }, 50);
    return () => clearTimeout(timer);
  }, [count, targetCount, hasAnimated]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.5 }}
      className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20"
    >
      <div className="text-center">
        <div className="text-4xl font-bold text-white mb-2">
          {shouldReduceMotion ? targetCount : Math.floor(count)}+
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
  trustText?: string;
}

export function Hero({
  title,
  subtitle,
  primaryButtonText,
  primaryButtonHref = "/editor",
  trustText
}: HeroProps = {}) {
  const { t } = useI18n();
  const shouldReduceMotion = useReducedMotion();
  
  const heroTitle = title || "Freedom starts with a plan — let's build yours.";
  const heroSubtitle = subtitle || "Find Austrian/EU funding you're eligible for and draft a plan in minutes.";
  const heroPrimaryButton = primaryButtonText || "Start your plan";
  const heroTrustText = trustText || t('hero.trust');

  return (
    <section 
      className="relative min-h-[100vh] sm:min-h-[80vh] flex items-center justify-center overflow-hidden bg-gradient-to-b from-neutral-800 via-neutral-900 to-black"
      aria-label="Hero section with main value proposition"
    >
      {/* Austria/EU Dot Map Background */}
      <div className="absolute inset-0 opacity-20">
        <svg className="w-full h-full" viewBox="0 0 1200 800" preserveAspectRatio="xMidYMid slice">
          {/* Austria outline */}
          <motion.path
            d="M200 300 L400 280 L450 320 L420 380 L380 420 L320 400 L250 380 L200 300 Z"
            fill="none"
            stroke="url(#gradient1)"
            strokeWidth="2"
            initial={{ pathLength: 0, opacity: 0 }}
            animate={{ pathLength: 1, opacity: 0.3 }}
            transition={{ duration: 3, ease: "easeInOut" }}
          />
          {/* EU countries dots */}
          {Array.from({ length: 20 }, (_, i) => (
            <motion.circle
              key={i}
              cx={300 + (i % 5) * 150}
              cy={200 + Math.floor(i / 5) * 100}
              r="3"
              fill="url(#gradient2)"
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 0.4 }}
              transition={{ 
                delay: i * 0.1, 
                duration: 0.5,
                repeat: shouldReduceMotion ? 0 : Infinity,
                repeatType: "reverse",
                repeatDelay: 2
              }}
            />
          ))}
          {/* Flowing arcs */}
          <motion.path
            d="M100 200 Q300 150 500 200 T900 180"
            fill="none"
            stroke="url(#gradient3)"
            strokeWidth="1"
            initial={{ pathLength: 0, opacity: 0 }}
            animate={{ pathLength: 1, opacity: 0.2 }}
            transition={{ 
              duration: 4, 
              ease: "easeInOut",
              repeat: shouldReduceMotion ? 0 : Infinity,
              repeatDelay: 1
            }}
          />
          <defs>
            <linearGradient id="gradient1" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#3B82F6" />
              <stop offset="100%" stopColor="#1E40AF" />
            </linearGradient>
            <linearGradient id="gradient2" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#60A5FA" />
              <stop offset="100%" stopColor="#3B82F6" />
            </linearGradient>
            <linearGradient id="gradient3" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#93C5FD" />
              <stop offset="100%" stopColor="#60A5FA" />
            </linearGradient>
          </defs>
        </svg>
      </div>

      {/* Radial Glow */}
      <div className="absolute w-[1000px] h-[1000px] rounded-full bg-primary opacity-10 blur-3xl"></div>

      {/* Floating Icons */}
      {icons.map((Icon, i) => (
        <FloatingIcon Icon={Icon} index={i} key={i} />
      ))}

      {/* Main Content Grid */}
      <div className="relative z-20 w-full max-w-7xl px-4 sm:px-6 grid lg:grid-cols-2 gap-12 items-center">
        {/* Left Content */}
        <div className="text-left">
          <motion.h1 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-white leading-tight mb-6"
          >
            {heroTitle}
          </motion.h1>
          
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.8 }}
            className="text-xl text-neutral-300 mb-8 max-w-2xl"
          >
            {heroSubtitle}
          </motion.p>

          {/* CTA Button */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, duration: 0.8 }}
            className="mb-8"
          >
            <a
              href={primaryButtonHref}
              className="inline-block px-8 py-4 bg-blue-600 text-white rounded-xl shadow-lg hover:bg-blue-700 transition-all duration-300 font-semibold text-lg hover:shadow-xl hover:scale-105 touch-target will-change-transform"
            >
              {heroPrimaryButton}
            </a>
          </motion.div>

          {/* Trust indicators */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.9, duration: 0.8 }}
            className="text-sm text-gray-400"
          >
            {heroTrustText}
          </motion.div>
        </div>

        {/* Right Content - Program Counter */}
        <div className="flex justify-center lg:justify-end">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.8, duration: 0.8 }}
          >
            <ProgramCounter />
          </motion.div>
        </div>
      </div>
    </section>
  );
}
