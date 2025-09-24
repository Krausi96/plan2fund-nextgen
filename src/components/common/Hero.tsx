import { motion, useReducedMotion } from "framer-motion";
import { memo, useState, useEffect } from "react";

// Blueprint Grid Background Component
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

// Simple Linear User Flow Animation Component
const UserFlowAnimation = memo(function UserFlowAnimation() {
  const shouldReduceMotion = useReducedMotion();
  const [currentStep, setCurrentStep] = useState(0);

  const flowSteps = [
    { 
      id: 1, 
      title: "Idea", 
      icon: "💡", 
      description: "Your business concept",
      help: "We help you structure it",
      color: "from-blue-500 to-cyan-500"
    },
    { 
      id: 2, 
      title: "Find Programs", 
      icon: "🔍", 
      description: "Discover funding opportunities",
      help: "We find 214+ programs you qualify for",
      color: "from-green-500 to-emerald-500"
    },
    { 
      id: 3, 
      title: "Create Plan", 
      icon: "📝", 
      description: "Build your business plan",
      help: "We build program-specific plans",
      color: "from-purple-500 to-pink-500"
    },
    { 
      id: 4, 
      title: "Submit & Track", 
      icon: "🚀", 
      description: "Apply and get funding",
      help: "We track your application progress",
      color: "from-orange-500 to-red-500"
    }
  ];

  // Auto-advance through steps
  useEffect(() => {
    if (shouldReduceMotion) return;
    
    const interval = setInterval(() => {
      setCurrentStep((prev) => (prev + 1) % flowSteps.length);
    }, 3000);
    
    return () => clearInterval(interval);
  }, [shouldReduceMotion, flowSteps.length]);

  return (
    <div className="relative w-full h-full flex items-center justify-center">
      <div className="relative w-full max-w-sm">
        {/* Linear Flow Container */}
        <div className="relative">
          {/* Connection Line */}
          <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-gradient-to-r from-blue-500 via-green-500 via-purple-500 to-orange-500 opacity-30"></div>
          
          {/* Flow Steps */}
          <div className="flex justify-between items-center relative z-10">
            {flowSteps.map((step, index) => (
              <motion.div
                key={step.id}
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ 
                  delay: shouldReduceMotion ? 0 : 0.5 + (index * 0.3),
                  duration: 0.6,
                  type: "spring",
                  stiffness: 100
                }}
                className="flex flex-col items-center"
              >
                {/* Step Card */}
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  animate={{
                    scale: currentStep === index ? [1, 1.1, 1] : 1,
                    boxShadow: currentStep === index ? 
                      ["0 0 0 0 rgba(59, 130, 246, 0.5)", "0 0 0 10px rgba(59, 130, 246, 0)", "0 0 0 0 rgba(59, 130, 246, 0)"] : 
                      "0 4px 6px -1px rgba(0, 0, 0, 0.1)"
                  }}
                  transition={{
                    duration: 2,
                    repeat: currentStep === index ? Infinity : 0,
                    ease: "easeInOut"
                  }}
                  className={`relative p-4 rounded-xl bg-white/10 backdrop-blur-md border-2 transition-all duration-300 ${
                    currentStep === index 
                      ? 'border-white/60 bg-white/20' 
                      : 'border-white/20'
                  }`}
                  style={{ width: '120px' }}
                >
                  {/* Step Icon */}
                  <motion.div
                    animate={{ 
                      scale: currentStep === index ? [1, 1.2, 1] : 1,
                    }}
                    transition={{ 
                      duration: 1.5,
                      repeat: currentStep === index ? Infinity : 0,
                      ease: "easeInOut"
                    }}
                    className={`w-10 h-10 mx-auto mb-2 bg-gradient-to-br ${step.color} rounded-full flex items-center justify-center text-white text-lg font-bold shadow-lg`}
                  >
                    {step.icon}
                  </motion.div>
                  
                  {/* Step Content */}
                  <div className="text-center">
                    <h3 className="text-xs font-bold text-white mb-1 leading-tight">
                      {step.title}
                    </h3>
                    <p className="text-xs text-blue-200 leading-tight mb-1">
                      {step.description}
                    </p>
                    {/* Help text - only show on active step */}
                    {currentStep === index && (
                      <motion.p 
                        initial={{ opacity: 0, y: 5 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3, duration: 0.5 }}
                        className="text-xs text-blue-300 font-medium leading-tight"
                      >
                        {step.help}
                      </motion.p>
                    )}
                  </div>
                </motion.div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
});

interface HeroProps {
  primaryButtonHref?: string;
}

export function Hero({
  primaryButtonHref = "/reco"
}: HeroProps = {}) {
  // Locked copy as specified
  const heroTitle = "Freedom starts with a plan — let's build yours.";
  const heroSubtitle = "Find funding matches and build an application-ready business plan tailored to Grants, Investors or Bank Loans (DE/EN). Start free.";
  const heroPrimaryButton = "Get funding matches";
  const heroSecondaryButton = "Start your plan";

  return (
    <section 
      className="relative min-h-[80vh] flex items-center overflow-hidden bg-gradient-to-b from-slate-900 via-blue-900 to-slate-800"
      aria-label="Hero section with main value proposition"
    >
      {/* Background */}
      <BlueprintGrid />

      {/* Main Content */}
      <div className="relative z-20 w-full max-w-7xl px-4 py-16 md:py-20 mx-auto">
        <div className="grid md:grid-cols-[6fr_6fr] xl:grid-cols-[7fr_5fr] gap-8 md:gap-12 items-center">
          
          {/* Text Content - Left Column (wider) */}
          <div className="text-left max-w-[65ch]">
            <motion.h1 
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              className="text-3xl sm:text-4xl lg:text-5xl xl:text-6xl font-extrabold text-white leading-tight mb-6 text-wrap-balance tracking-tight xl:tracking-tighter"
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
              className="flex flex-col sm:flex-row gap-4 mb-6"
            >
              <motion.a
                href={primaryButtonHref}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="inline-flex items-center justify-center px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl transition-colors duration-200 shadow-lg hover:shadow-xl"
              >
                {heroPrimaryButton}
              </motion.a>
              
              <motion.a
                href="/editor"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="inline-flex items-center justify-center px-8 py-4 border-2 border-white/30 hover:border-white/50 text-white font-semibold rounded-xl transition-colors duration-200 backdrop-blur-sm hover:bg-white/10"
              >
                {heroSecondaryButton}
              </motion.a>
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
