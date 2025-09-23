import { motion, useReducedMotion } from "framer-motion";
import { memo } from "react";

interface HeroProps {
  title?: string;
  subtitle?: string;
  primaryButtonText?: string;
  primaryButtonHref?: string;
}

// Blueprint Grid Component
const BlueprintGrid = memo(function BlueprintGrid() {
  return (
    <div className="absolute inset-0">
      {/* Deep blue gradient background */}
      <div className="absolute inset-0 bg-gradient-to-b from-slate-900 via-blue-900 to-slate-800" />
      
      {/* Blueprint grid overlay */}
      <div 
        className="absolute inset-0 opacity-[0.06]"
        style={{
          backgroundImage: `
            repeating-linear-gradient(
              0deg,
              transparent,
              transparent 56px,
              #60A5FA 56px,
              #60A5FA 57px
            ),
            repeating-linear-gradient(
              90deg,
              transparent,
              transparent 56px,
              #60A5FA 56px,
              #60A5FA 57px
            )
          `,
        }}
      />
      
      {/* Mobile grid - smaller cells */}
      <div 
        className="absolute inset-0 opacity-[0.04] md:hidden"
        style={{
          backgroundImage: `
            repeating-linear-gradient(
              0deg,
              transparent,
              transparent 40px,
              #60A5FA 40px,
              #60A5FA 41px
            ),
            repeating-linear-gradient(
              90deg,
              transparent,
              transparent 40px,
              #60A5FA 40px,
              #60A5FA 41px
            )
          `,
        }}
      />
    </div>
  );
});

// Animated Blueprint Lines Component
const BlueprintLines = memo(function BlueprintLines() {
  const shouldReduceMotion = useReducedMotion();
  
  return (
    <div className="absolute inset-0 pointer-events-none">
      <svg className="w-full h-full" viewBox="0 0 1200 800" preserveAspectRatio="xMidYMid slice">
        {/* Line A - Diagonal high */}
        <motion.path
          d="M 100 150 Q 300 200 500 300 Q 700 400 900 500"
          fill="none"
          stroke="url(#lineGradient)"
          strokeWidth="2"
          initial={{ pathLength: 0, opacity: 0 }}
          animate={shouldReduceMotion ? { pathLength: 1, opacity: 0.7 } : { 
            pathLength: 1, 
            opacity: 0.7 
          }}
          transition={{ 
            duration: 0.9, 
            ease: "easeOut",
            delay: 0.2
          }}
          className="hidden md:block"
        />
        
        {/* Line B - Shallow arc */}
        <motion.path
          d="M 150 300 Q 400 250 650 350 Q 850 400 1000 450"
          fill="none"
          stroke="url(#lineGradient)"
          strokeWidth="2"
          initial={{ pathLength: 0, opacity: 0 }}
          animate={shouldReduceMotion ? { pathLength: 1, opacity: 0.6 } : { 
            pathLength: 1, 
            opacity: 0.6 
          }}
          transition={{ 
            duration: 1.1, 
            ease: "easeInOut",
            delay: 0.35
          }}
          className="hidden md:block"
        />
        
        {/* Line C - Diagonal low */}
        <motion.path
          d="M 200 450 Q 400 400 600 450 Q 800 500 1000 550"
          fill="none"
          stroke="url(#lineGradient)"
          strokeWidth="2"
          initial={{ pathLength: 0, opacity: 0 }}
          animate={shouldReduceMotion ? { pathLength: 1, opacity: 0.5 } : { 
            pathLength: 1, 
            opacity: 0.5 
          }}
          transition={{ 
            duration: 0.8, 
            ease: "easeOut",
            delay: 0.5
          }}
          className="hidden md:block"
        />
        
        {/* Mobile static line */}
        <motion.path
          d="M 50 200 Q 200 250 350 300 Q 500 350 650 400"
          fill="none"
          stroke="url(#lineGradient)"
          strokeWidth="1.5"
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{ pathLength: 1, opacity: 0.6 }}
          transition={{ 
            duration: 0.8, 
            ease: "easeOut",
            delay: 0.3
          }}
          className="block md:hidden"
        />
        
        {/* Gradient definitions */}
        <defs>
          <linearGradient id="lineGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#8B5CF6" stopOpacity="0.7" />
            <stop offset="50%" stopColor="#60A5FA" stopOpacity="0.8" />
            <stop offset="100%" stopColor="#3B82F6" stopOpacity="0.6" />
          </linearGradient>
        </defs>
      </svg>
    </div>
  );
});

export function Hero({
  title,
  subtitle,
  primaryButtonText,
  primaryButtonHref = "/reco"
}: HeroProps = {}) {
  const heroTitle = title || "Freedom starts with a plan — let's build yours.";
  const heroSubtitle = subtitle || "Plan2Fund finds Austrian grants and programs (AWS, FFG, Wirtschaftsagentur) and guides you from business model to bank-ready financials — generate or upgrade your business plan in German or English";
  const heroPrimaryButton = primaryButtonText || "Get funding matches";

  return (
    <section 
      className="relative min-h-[100vh] flex items-center overflow-hidden"
      aria-label="Hero section with main value proposition"
    >
      {/* Background */}
      <BlueprintGrid />
      <BlueprintLines />

      {/* Main Content */}
      <div className="relative z-20 w-full max-w-7xl px-4 py-20 md:py-28 mx-auto">
        <div className="grid md:grid-cols-[1.15fr_0.85fr] gap-8 md:gap-12 items-center">
          
          {/* Text Content */}
          <div className="text-left">
            <motion.h1 
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              className="text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-extrabold text-white leading-tight mb-6 text-wrap-balance tracking-tight xl:tracking-tighter"
              style={{ textWrap: 'balance' }}
            >
              {heroTitle}
            </motion.h1>
            
            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.8 }}
              className="text-lg md:text-xl text-blue-100 mb-8 max-w-[60ch] leading-relaxed"
            >
              {heroSubtitle}
            </motion.p>

            {/* Step Progress Line */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6, duration: 0.8 }}
              className="mb-8"
            >
              <div className="flex items-center gap-2 text-sm text-blue-200">
                <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                <span>Answer</span>
                <div className="w-1 h-1 bg-blue-400 rounded-full"></div>
                <span>See matches</span>
                <div className="w-1 h-1 bg-blue-400 rounded-full"></div>
                <span>Export</span>
              </div>
            </motion.div>

            {/* CTA Buttons */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.9, duration: 0.8 }}
              className="flex flex-col sm:flex-row gap-3 sm:gap-4"
            >
              <a
                href={primaryButtonHref}
                className="inline-block px-6 py-4 bg-blue-600 text-white rounded-xl shadow-lg hover:bg-blue-700 transition-all duration-300 font-semibold text-lg hover:shadow-xl hover:scale-[1.02] touch-target will-change-transform text-center"
              >
                {heroPrimaryButton}
              </a>
              <a
                href="/editor"
                className="inline-block px-6 py-4 bg-transparent text-white border-2 border-white/30 rounded-xl hover:border-white/60 hover:bg-white/5 transition-all duration-300 font-semibold text-lg touch-target will-change-transform text-center"
              >
                Start your plan
              </a>
            </motion.div>

            {/* Proof Chips */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.2, duration: 0.8 }}
              className="mt-6 flex flex-wrap gap-2"
            >
              <span className="px-3 py-1 text-xs font-medium text-blue-200 bg-blue-900/30 border border-blue-700/30 rounded-full">
                Austria-specific
              </span>
              <span className="px-3 py-1 text-xs font-medium text-blue-200 bg-blue-900/30 border border-blue-700/30 rounded-full">
                German & English
              </span>
              <span className="px-3 py-1 text-xs font-medium text-blue-200 bg-blue-900/30 border border-blue-700/30 rounded-full">
                Start free
              </span>
            </motion.div>
          </div>

          {/* Visual Column - Hidden on mobile */}
          <div className="hidden md:block">
            {/* This space is reserved for future visual elements */}
          </div>
        </div>
      </div>
    </section>
  );
}