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

// User Flow Animation Component
const UserFlowAnimation = memo(function UserFlowAnimation() {
  const shouldReduceMotion = useReducedMotion();

  const flowSteps = [
    { id: 1, title: "Idea", icon: "💡", description: "Your business concept" },
    { id: 2, title: "Business Model", icon: "📊", description: "One of our products" },
    { id: 3, title: "Find Funding", icon: "🔍", description: "Program types" },
    { id: 4, title: "Create Plan", icon: "📝", description: "Business plan" },
    { id: 5, title: "Get Funding", icon: "💰", description: "Success!" }
  ];

  return (
    <div className="relative w-full h-full flex items-center justify-center">
      <div className="relative w-full max-w-md">
        {/* Flow Steps */}
        <div className="space-y-6">
          {flowSteps.map((step, index) => (
            <motion.div
              key={step.id}
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ 
                delay: shouldReduceMotion ? 0 : 0.5 + (index * 0.3),
                duration: 0.6 
              }}
              className="flex items-center space-x-4 group"
            >
              {/* Step Circle */}
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ 
                  delay: shouldReduceMotion ? 0 : 0.7 + (index * 0.3),
                  duration: 0.4,
                  type: "spring",
                  stiffness: 200
                }}
                className="flex-shrink-0 w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-lg font-bold shadow-lg group-hover:scale-110 transition-transform duration-300"
              >
                {step.icon}
              </motion.div>
              
              {/* Step Content */}
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-white mb-1">
                  {step.title}
                </h3>
                <p className="text-sm text-blue-200">
                  {step.description}
                </p>
              </div>
              
              {/* Arrow (except for last step) */}
              {index < flowSteps.length - 1 && (
                <motion.div
                  initial={{ opacity: 0, scale: 0 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ 
                    delay: shouldReduceMotion ? 0 : 1.0 + (index * 0.3),
                    duration: 0.3 
                  }}
                  className="flex-shrink-0 text-blue-300"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </motion.div>
              )}
            </motion.div>
          ))}
        </div>
        
        {/* Animated Progress Line */}
        <motion.div
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ 
            delay: shouldReduceMotion ? 0 : 0.8,
            duration: 2.0,
            ease: "easeInOut"
          }}
          className="absolute left-6 top-6 bottom-6 w-0.5 bg-gradient-to-b from-blue-400 to-purple-500 origin-top"
          style={{ transformOrigin: "top" }}
        />
      </div>
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

  return (
    <section 
      className="relative min-h-[80vh] flex items-center overflow-hidden"
      aria-label="Hero section with main value proposition"
    >
      {/* Background */}
      <BlueprintGrid />

      {/* Main Content */}
      <div className="relative z-20 w-full max-w-7xl px-4 py-16 md:py-20 mx-auto">
        <div className="grid md:grid-cols-[6fr_6fr] xl:grid-cols-[7fr_5fr] gap-8 md:gap-12 items-center">
          
          {/* Text Content - Left Column (wider) */}
          <div className="text-left max-w-[70ch]">
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

            {/* CTA Buttons */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6, duration: 0.8 }}
              className="flex flex-col sm:flex-row gap-3 sm:gap-4 mb-8"
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

            {/* Safety Microcopy */}
            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.9, duration: 0.8 }}
              className="text-xs text-blue-200/80"
            >
              We help you prepare your application; decisions are made by the providers.
            </motion.p>
          </div>

          {/* User Flow Animation - Right Column */}
          <div className="hidden md:block">
            <UserFlowAnimation />
          </div>
        </div>

        {/* Mobile User Flow */}
        <div className="md:hidden mt-12">
          <UserFlowAnimation />
        </div>
      </div>
    </section>
  );
}