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

// Right Column Animated User Flow Component
const AnimatedUserFlow = memo(function AnimatedUserFlow() {
  const shouldReduceMotion = useReducedMotion();
  const [currentChip, setCurrentChip] = useState(0);
  
  const fundingChips = ["Equity", "National/EU grants", "Bank loans & leasing", "Coaching"];
  
  useEffect(() => {
    if (shouldReduceMotion) return;
    
    const interval = setInterval(() => {
      setCurrentChip((prev) => (prev + 1) % fundingChips.length);
    }, 2000);
    
    return () => clearInterval(interval);
  }, [shouldReduceMotion, fundingChips.length]);

  const steps = [
    {
      id: 1,
      title: "Business idea → Model & strategy",
      description: "Sketch your model, go-to-market & unit economics (start or import).",
      delay: 0.1
    },
    {
      id: 2,
      title: "Find funding (via Recommendation Engine)",
      description: "Equity · National/EU grants · Bank loans & leasing · Coaching",
      delay: 0.2,
      hasChips: true
    },
    {
      id: 3,
      title: "Build application-ready plan",
      description: "Generate or upgrade a DE/EN plan tailored to the selected program/bank.",
      delay: 0.3
    },
    {
      id: 4,
      title: "Export & apply",
      description: "PDF/DOCX + submission checklist",
      delay: 0.4
    }
  ];

  return (
    <div className="relative">
      {/* Animated Path */}
      <div className="absolute left-6 top-8 bottom-8 w-0.5 bg-gradient-to-b from-blue-400 via-blue-500 to-blue-600 opacity-60">
        <motion.div
          className="absolute w-2 h-2 bg-blue-400 rounded-full -left-1.5"
          initial={{ top: 0 }}
          animate={shouldReduceMotion ? { top: "100%" } : { top: "100%" }}
          transition={{ duration: 1.2, ease: "easeInOut", delay: 0.5 }}
        />
      </div>

      <div className="space-y-6 pl-12">
        {steps.map((step) => (
          <motion.div
            key={step.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: step.delay, duration: 0.6 }}
            className="bg-white/95 backdrop-blur-sm rounded-xl p-4 shadow-lg border border-white/20"
            aria-label={`Step ${step.id}: ${step.title}`}
          >
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-semibold flex-shrink-0">
                {step.id}
              </div>
              <div className="flex-1">
                <h3 className="text-sm font-semibold text-gray-800 mb-2">{step.title}</h3>
                <p className="text-xs text-gray-600 mb-3">{step.description}</p>
                
                {step.hasChips && (
                  <div className="flex flex-wrap gap-1">
                    {fundingChips.map((chip, chipIndex) => (
                      <span
                        key={chip}
                        className={`px-2 py-1 text-xs font-medium rounded-full transition-all duration-500 ${
                          chipIndex === currentChip
                            ? "bg-blue-100 text-blue-700 border border-blue-200"
                            : "bg-gray-100 text-gray-600"
                        }`}
                      >
                        {chip}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
});

// Animated Blueprint Lines Component
const BlueprintLines = memo(function BlueprintLines() {
  const shouldReduceMotion = useReducedMotion();
  
  return (
    <div className="absolute inset-0 pointer-events-none">
      <svg className="w-full h-full" viewBox="0 0 1200 800" preserveAspectRatio="xMidYMid slice">
        {/* Line 1: Answer → Card A (Funding matches) */}
        <motion.path
          d="M 200 400 Q 400 350 600 300 Q 800 250 900 200"
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
        
        {/* Line 2: See matches → Card B (Plan outline) */}
        <motion.path
          d="M 250 420 Q 450 370 650 320 Q 850 270 950 250"
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
            delay: 0.4
          }}
          className="hidden md:block"
        />
        
        {/* Line 3: Build plan & export → Card C (Export) */}
        <motion.path
          d="M 300 440 Q 500 390 700 340 Q 900 290 1000 300"
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
            delay: 0.6
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
  primaryButtonHref = "/reco"
}: HeroProps = {}) {
  // Locked copy as specified
  const heroTitle = "Freedom starts with a plan — let's build yours.";
  const heroSubtitle = "Find funding matches and build the application-ready business plan made for grants, visas, or bank loans (DE/EN).";
  const heroPrimaryButton = "Get funding matches";

  return (
    <section 
      className="relative min-h-[100vh] flex items-center overflow-hidden"
      aria-label="Hero section with main value proposition"
    >
      {/* Background */}
      <BlueprintGrid />
      <BlueprintLines />

      {/* Main Content */}
      <div className="relative z-20 w-full max-w-7xl px-4 py-24 md:py-32 mx-auto">
        <div className="grid md:grid-cols-[1.1fr_0.9fr] gap-8 md:gap-10 items-center">
          
          {/* Text Content - Left Column (55-60%) */}
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
                <span>Build plan & export</span>
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
                href="/editor"
                className="inline-block px-6 py-4 bg-transparent text-white border-2 border-white/50 rounded-xl hover:border-white/80 hover:bg-white/10 transition-all duration-300 font-semibold text-lg touch-target will-change-transform text-center min-h-[44px] min-w-[44px]"
              >
                Start your plan
              </a>
            </motion.div>

            {/* Proof Chips */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.2, duration: 0.8 }}
              className="flex flex-wrap gap-2 mb-4"
            >
              <span className="px-3 py-1 text-xs font-medium text-blue-200 bg-blue-900/30 border border-blue-700/30 rounded-full">
                Austria/EU-Call-specific
              </span>
              <span className="px-3 py-1 text-xs font-medium text-blue-200 bg-blue-900/30 border border-blue-700/30 rounded-full">
                German & English
              </span>
              <span className="px-3 py-1 text-xs font-medium text-blue-200 bg-blue-900/30 border border-blue-700/30 rounded-full">
                Start free
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

          {/* Visual Preview Column - Right Column (40-45%) */}
          <div className="hidden md:block">
            <AnimatedUserFlow />
          </div>
        </div>

        {/* Mobile Horizontal Stepper */}
        <div className="md:hidden mt-12">
          <div className="flex gap-4 overflow-x-auto pb-4 snap-x snap-mandatory">
            {[
              {
                id: 1,
                title: "Business idea → Model & strategy",
                description: "Sketch your model, go-to-market & unit economics"
              },
              {
                id: 2,
                title: "Find funding",
                description: "Equity · Grants · Bank loans · Coaching"
              },
              {
                id: 3,
                title: "Build application-ready plan",
                description: "Generate DE/EN plan tailored to program"
              },
              {
                id: 4,
                title: "Export & apply",
                description: "PDF/DOCX + submission checklist"
              }
            ].map((step, index) => (
              <motion.div
                key={step.id}
                initial={{ opacity: 0, x: 30 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1, duration: 0.6 }}
                className="flex-shrink-0 w-64 bg-white/95 backdrop-blur-sm rounded-xl p-4 shadow-lg border border-white/20 snap-center"
              >
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-semibold flex-shrink-0">
                    {step.id}
                  </div>
                  <div className="flex-1">
                    <h3 className="text-sm font-semibold text-gray-800 mb-1">{step.title}</h3>
                    <p className="text-xs text-gray-600">{step.description}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}