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
  const shouldReduceMotion = useReducedMotion();
  
  return (
    <div className="absolute inset-0 opacity-20">
      <svg className="w-full h-full" viewBox="0 0 1200 800" preserveAspectRatio="xMidYMid slice">
        {/* Grid lines - responsive density */}
        <defs>
          <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
            <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#60A5FA" strokeWidth="0.5" opacity="0.3"/>
          </pattern>
          <pattern id="grid-mobile" width="60" height="60" patternUnits="userSpaceOnUse">
            <path d="M 60 0 L 0 0 0 60" fill="none" stroke="#60A5FA" strokeWidth="0.3" opacity="0.2"/>
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#grid)" className="hidden sm:block" />
        <rect width="100%" height="100%" fill="url(#grid-mobile)" className="block sm:hidden" />
        
        {/* Animated flow lines - responsive paths */}
        <g opacity="0.6">
          {/* Main flow line - Desktop */}
          <motion.path
            d="M 200 200 Q 400 300 600 400 Q 800 500 1000 600"
            fill="none"
            stroke="#60A5FA"
            strokeWidth="2"
            initial={{ pathLength: 0, opacity: 0 }}
            animate={shouldReduceMotion ? { pathLength: 1, opacity: 0.6 } : { 
              pathLength: 1, 
              opacity: 0.8 
            }}
            transition={{ 
              duration: 1.2, 
              ease: "easeInOut",
              delay: 0.5
            }}
            className="hidden sm:block"
          />
          
          {/* Main flow line - Mobile (shorter) */}
          <motion.path
            d="M 150 300 Q 300 400 450 500 Q 600 600 750 700"
            fill="none"
            stroke="#60A5FA"
            strokeWidth="1.5"
            initial={{ pathLength: 0, opacity: 0 }}
            animate={shouldReduceMotion ? { pathLength: 1, opacity: 0.6 } : { 
              pathLength: 1, 
              opacity: 0.8 
            }}
            transition={{ 
              duration: 1.0, 
              ease: "easeInOut",
              delay: 0.5
            }}
            className="block sm:hidden"
          />
          
          {/* Secondary flow line - Desktop */}
          <motion.path
            d="M 150 350 Q 350 250 550 300 Q 750 350 950 500"
            fill="none"
            stroke="#3B82F6"
            strokeWidth="1.5"
            initial={{ pathLength: 0, opacity: 0 }}
            animate={shouldReduceMotion ? { pathLength: 1, opacity: 0.4 } : { 
              pathLength: 1, 
              opacity: 0.6 
            }}
            transition={{ 
              duration: 1.0, 
              ease: "easeInOut",
              delay: 0.8
            }}
            className="hidden sm:block"
          />
          
          {/* Secondary flow line - Mobile */}
          <motion.path
            d="M 100 450 Q 250 350 400 400 Q 550 450 700 550"
            fill="none"
            stroke="#3B82F6"
            strokeWidth="1"
            initial={{ pathLength: 0, opacity: 0 }}
            animate={shouldReduceMotion ? { pathLength: 1, opacity: 0.4 } : { 
              pathLength: 1, 
              opacity: 0.6 
            }}
            transition={{ 
              duration: 0.8, 
              ease: "easeInOut",
              delay: 0.8
            }}
            className="block sm:hidden"
          />
          
          {/* Tertiary flow line - Desktop */}
          <motion.path
            d="M 250 500 Q 450 400 650 450 Q 850 500 1050 550"
            fill="none"
            stroke="#1D4ED8"
            strokeWidth="1"
            initial={{ pathLength: 0, opacity: 0 }}
            animate={shouldReduceMotion ? { pathLength: 1, opacity: 0.3 } : { 
              pathLength: 1, 
              opacity: 0.5 
            }}
            transition={{ 
              duration: 0.8, 
              ease: "easeInOut",
              delay: 1.1
            }}
            className="hidden sm:block"
          />
        </g>
        
        {/* Flow nodes - responsive positioning */}
        <g>
          {/* Idea node - Desktop */}
          <motion.circle
            cx="200"
            cy="200"
            r="8"
            fill="#60A5FA"
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.5 }}
            className="hidden sm:block"
          />
          
          {/* Idea node - Mobile */}
          <motion.circle
            cx="150"
            cy="300"
            r="6"
            fill="#60A5FA"
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.5 }}
            className="block sm:hidden"
          />
          
          {/* Matches node - Desktop */}
          <motion.circle
            cx="600"
            cy="400"
            r="8"
            fill="#3B82F6"
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.7, duration: 0.5 }}
            className="hidden sm:block"
          />
          
          {/* Matches node - Mobile */}
          <motion.circle
            cx="450"
            cy="500"
            r="6"
            fill="#3B82F6"
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.7, duration: 0.5 }}
            className="block sm:hidden"
          />
          
          {/* Plan node - Desktop */}
          <motion.circle
            cx="1000"
            cy="600"
            r="8"
            fill="#1D4ED8"
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 1.1, duration: 0.5 }}
            className="hidden sm:block"
          />
          
          {/* Plan node - Mobile */}
          <motion.circle
            cx="750"
            cy="700"
            r="6"
            fill="#1D4ED8"
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 1.1, duration: 0.5 }}
            className="block sm:hidden"
          />
        </g>
      </svg>
    </div>
  );
});

export function Hero({
  title,
  subtitle,
  primaryButtonText,
  primaryButtonHref = "/editor"
}: HeroProps = {}) {
  const heroTitle = title || "Freedom starts with a plan — let's build yours.";
  const heroSubtitle = subtitle || "Plan2Fund finds Austrian grants and programs (AWS, FFG, Wirtschaftsagentur) and guides you from business model to bank-ready financials — generate or upgrade your business plan in German or English";
  const heroPrimaryButton = primaryButtonText || "Start your plan";

  return (
    <section 
      className="relative min-h-[100vh] sm:min-h-[80vh] flex items-center justify-center overflow-hidden bg-gradient-to-b from-slate-900 via-blue-900 to-slate-800"
      aria-label="Hero section with main value proposition"
    >
      {/* Blueprint Grid Background */}
      <BlueprintGrid />

      {/* Main Content */}
      <div className="relative z-20 w-full max-w-6xl px-4 sm:px-6 text-center">
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
          className="text-xl text-blue-100 mb-8 max-w-4xl mx-auto"
        >
          {heroSubtitle}
        </motion.p>

        {/* 3-Step Process */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6, duration: 0.8 }}
          className="mb-12"
        >
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-8 text-sm text-blue-200">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
              <span>Answer a few practical questions</span>
            </div>
            <div className="hidden sm:block text-blue-400">→</div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
              <span>See matched programs</span>
            </div>
            <div className="hidden sm:block text-blue-400">→</div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
              <span>Export a funding-ready plan</span>
            </div>
          </div>
        </motion.div>

        {/* CTA Buttons */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.9, duration: 0.8 }}
          className="flex flex-col sm:flex-row gap-4 justify-center"
        >
          <a
            href={primaryButtonHref}
            className="inline-block px-8 py-4 bg-blue-600 text-white rounded-xl shadow-lg hover:bg-blue-700 transition-all duration-300 font-semibold text-lg hover:shadow-xl hover:scale-105 touch-target will-change-transform text-center"
          >
            {heroPrimaryButton}
          </a>
          <a
            href="/reco"
            className="inline-block px-8 py-4 bg-white/10 backdrop-blur-sm text-white border border-white/20 rounded-xl hover:bg-white/20 transition-all duration-300 font-semibold text-lg hover:shadow-xl hover:scale-105 touch-target will-change-transform text-center"
          >
            Get Recommendations
          </a>
        </motion.div>
      </div>
    </section>
  );
}
