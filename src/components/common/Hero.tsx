import { motion, useReducedMotion } from "framer-motion";
import { memo, useState, useEffect } from "react";

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
      
      {/* Blueprint grid overlay - reduced opacity to ≤6% */}
      <div 
        className="absolute inset-0 opacity-[0.06]"
        style={{
          backgroundImage: `
            repeating-linear-gradient(
              0deg,
              transparent,
              transparent 48px,
              #60A5FA 48px,
              #60A5FA 49px
            ),
            repeating-linear-gradient(
              90deg,
              transparent,
              transparent 48px,
              #60A5FA 48px,
              #60A5FA 49px
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
              transparent 32px,
              #60A5FA 32px,
              #60A5FA 33px
            ),
            repeating-linear-gradient(
              90deg,
              transparent,
              transparent 32px,
              #60A5FA 32px,
              #60A5FA 33px
            )
          `,
        }}
      />
    </div>
  );
});

// Plan Capsule Component
const PlanCapsule = memo(function PlanCapsule() {
  const shouldReduceMotion = useReducedMotion();
  const [isFlashed, setIsFlashed] = useState(false);

  useEffect(() => {
    if (shouldReduceMotion) return;
    
    const timer = setTimeout(() => {
      setIsFlashed(true);
      setTimeout(() => setIsFlashed(false), 140);
    }, 1200); // After dot arrives
    
    return () => clearTimeout(timer);
  }, [shouldReduceMotion]);

  return (
    <div className="relative">
      {/* Plan Capsule Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8, duration: 0.6 }}
        className={`bg-white/95 backdrop-blur-sm rounded-xl p-6 shadow-lg border border-white/20 transition-all duration-140 ${
          isFlashed ? 'shadow-blue-400/50 shadow-2xl' : ''
        }`}
        aria-label="Plan preview"
      >
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Application-ready plan</h3>
        <div className="space-y-2 text-sm text-gray-600">
          <div className="h-3 bg-gray-200 rounded w-3/4"></div>
          <div className="h-3 bg-gray-200 rounded w-1/2"></div>
          <div className="h-3 bg-gray-200 rounded w-2/3"></div>
        </div>
      </motion.div>
      
      {/* PDF/DOCX Pill */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.0, duration: 0.4 }}
        className="mt-3 text-center"
      >
        <span className="inline-block px-3 py-1 text-xs font-medium text-gray-600 bg-gray-100 rounded-full">
          PDF · DOCX
        </span>
      </motion.div>
    </div>
  );
});

// Single Line Funding Path Animation
const FundingPathAnimation = memo(function FundingPathAnimation() {
  const shouldReduceMotion = useReducedMotion();

  return (
    <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
      <svg className="w-full h-full" viewBox="0 0 1200 800" preserveAspectRatio="xMidYMid slice">
        {/* Single S-curve path from mini steps to Plan Capsule */}
        <motion.path
          d="M 200 500 Q 400 450 600 400 Q 800 350 1000 300"
          fill="none"
          stroke="url(#pathGradient)"
          strokeWidth="2"
          initial={{ pathLength: 0, opacity: 0 }}
          animate={shouldReduceMotion ? { pathLength: 1, opacity: 0.7 } : { 
            pathLength: 1, 
            opacity: 0.7 
          }}
          transition={{ 
            duration: 1.0, 
            ease: "easeOut",
            delay: 0.12
          }}
          className="hidden md:block"
        />
        
        {/* Traveling dot */}
        <motion.circle
          cx="200"
          cy="500"
          r="3"
          fill="url(#dotGradient)"
          initial={{ pathLength: 0, opacity: 0 }}
          animate={shouldReduceMotion ? { 
            pathLength: 1, 
            opacity: 0 
          } : { 
            pathLength: 1, 
            opacity: 1,
            cx: [200, 1000],
            cy: [500, 300]
          }}
          transition={{ 
            duration: 1.0, 
            ease: "easeOut",
            delay: 0.12
          }}
          className="hidden md:block"
        />
        
        {/* Gradient definitions */}
        <defs>
          <linearGradient id="pathGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#3B82F6" stopOpacity="0.6" />
            <stop offset="50%" stopColor="#60A5FA" stopOpacity="0.7" />
            <stop offset="100%" stopColor="#8B5CF6" stopOpacity="0.6" />
          </linearGradient>
          <linearGradient id="dotGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#60A5FA" stopOpacity="0.9" />
            <stop offset="100%" stopColor="#3B82F6" stopOpacity="0.9" />
          </linearGradient>
        </defs>
      </svg>
    </div>
  );
});


export function Hero({
  primaryButtonHref = "/reco"
}: HeroProps = {}) {
  // Locked copy as specified
  const heroTitle = "Freedom starts with a plan — let's build yours.";
  const heroSubtitle = "Find funding matches and build the application-ready business plan they require—grants, visas, or bank loans (DE/EN). Start free.";
  const heroPrimaryButton = "Get funding matches";
  const heroSecondaryButton = "Start your plan";
  const miniStepsText = "Idea → Funding → Plan → Apply";

  return (
    <section 
      className="relative min-h-[100vh] flex items-center overflow-hidden"
      aria-label="Hero section with main value proposition"
    >
      {/* Background */}
      <BlueprintGrid />
      <FundingPathAnimation />

      {/* Main Content */}
      <div className="relative z-20 w-full max-w-7xl px-4 py-24 md:py-32 mx-auto">
        <div className="grid md:grid-cols-[7fr_5fr] xl:grid-cols-[8fr_4fr] gap-10 md:gap-12 items-center">
          
          {/* Text Content - Left Column (wider) */}
          <div className="text-left max-w-[60ch]">
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
              className="text-lg md:text-xl text-blue-100 mb-8 leading-relaxed"
            >
              {heroSubtitle}
            </motion.p>

            {/* Mini Steps Text (one line) */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6, duration: 0.8 }}
              className="mb-8"
            >
              <div className="text-sm text-blue-200">
                {miniStepsText}
              </div>
            </motion.div>

            {/* CTA Buttons */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.9, duration: 0.8 }}
              className="flex flex-col sm:flex-row gap-3 sm:gap-4 mb-6"
            >
              <a
                href={primaryButtonHref}
                className="inline-block px-6 py-4 bg-blue-600 text-white rounded-xl shadow-lg hover:bg-blue-700 transition-all duration-300 font-semibold text-lg hover:shadow-xl hover:scale-[1.02] touch-target will-change-transform text-center min-h-[44px] min-w-[44px]"
              >
                {heroPrimaryButton}
              </a>
              <a
                href="/editor?mode=outline"
                className="inline-block px-6 py-4 bg-transparent text-white border-2 border-white/50 rounded-xl hover:border-white/80 hover:bg-white/10 transition-all duration-300 font-semibold text-lg touch-target will-change-transform text-center min-h-[44px] min-w-[44px]"
              >
                {heroSecondaryButton}
              </a>
            </motion.div>

            {/* Offer Chips */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.2, duration: 0.8 }}
              className="flex flex-wrap gap-2 mb-4"
            >
              <span className="px-3 py-1 text-xs font-medium text-blue-200 bg-blue-900/30 border border-blue-700/30 rounded-full">
                Funding matches (Free)
              </span>
              <span className="px-3 py-1 text-xs font-medium text-blue-200 bg-blue-900/30 border border-blue-700/30 rounded-full">
                Plan outline (Free)
              </span>
              <span className="px-3 py-1 text-xs font-medium text-blue-200 bg-blue-900/30 border border-blue-700/30 rounded-full">
                Full plan & export (Paid)
              </span>
              <span className="px-3 py-1 text-xs font-medium text-blue-200 bg-blue-900/30 border border-blue-700/30 rounded-full">
                Add-ons (Paid)
              </span>
            </motion.div>

            {/* Safety Microcopy */}
            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.4, duration: 0.8 }}
              className="text-xs text-blue-200/80"
            >
              We help you prepare your application; decisions are made by the providers.
            </motion.p>
          </div>

          {/* Plan Capsule - Right Column */}
          <div className="hidden md:block">
            <PlanCapsule />
          </div>
        </div>

        {/* Mobile Plan Capsule */}
        <div className="md:hidden mt-12">
          <PlanCapsule />
        </div>
      </div>
    </section>
  );
}