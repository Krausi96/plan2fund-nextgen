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

// Simple User Flow Animation Component
const UserFlowAnimation = memo(function UserFlowAnimation({ onStepClick }: { onStepClick?: (stepId: number) => void }) {
  const shouldReduceMotion = useReducedMotion();
  const [currentStep, setCurrentStep] = useState(0);

  const flowSteps = [
    { 
      id: 1, 
      title: "Idea", 
      icon: "💡", 
      description: "Define Business Concept",
      color: "from-blue-500 to-cyan-500"
    },
    { 
      id: 2, 
      title: "Business Model", 
      icon: "🏢", 
      description: "Prepare Market Entry",
      color: "from-green-500 to-emerald-500"
    },
    { 
      id: 3, 
      title: "Funding", 
      icon: "🔍", 
      description: "Find Funding Options",
      color: "from-purple-500 to-pink-500"
    },
    { 
      id: 4, 
      title: "Business Plan", 
      icon: "📝", 
      description: "Build your Business Plan",
      color: "from-orange-500 to-red-500"
    },
    { 
      id: 5, 
      title: "Application", 
      icon: "💰", 
      description: "Apply for funding",
      color: "from-yellow-500 to-orange-500"
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
    <div className="relative w-full flex items-center justify-center p-4">
      <div className="relative w-full max-w-4xl">
        {/* Horizontal Flow Container */}
        <div className="flex flex-col md:flex-row items-center justify-center space-y-4 md:space-y-0 md:space-x-4">
          {/* Flow Steps */}
          {flowSteps.map((step, index) => (
            <div key={step.id} className="relative flex items-center">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ 
                  delay: shouldReduceMotion ? 0 : 0.2 + (index * 0.1),
                  duration: 0.5
                }}
                className={`relative p-3 rounded-lg bg-white/10 backdrop-blur-md border transition-all duration-300 cursor-pointer hover:bg-white/20 hover:border-white/40 ${
                  currentStep === index 
                    ? 'border-white/60 bg-white/20' 
                    : 'border-white/20'
                }`}
                style={{ width: '160px' }}
                onClick={() => onStepClick?.(step.id)}
              >
                {/* Step Icon */}
                <div className={`w-8 h-8 mx-auto mb-2 bg-gradient-to-br ${step.color} rounded-full flex items-center justify-center text-white text-sm font-bold`}>
                  {step.icon}
                </div>
                
                {/* Step Content */}
                <div className="text-center">
                  <h3 className="text-sm font-bold text-white mb-1">
                    {step.title}
                  </h3>
                  <p className="text-xs text-blue-200 leading-tight">
                    {step.description}
                  </p>
                </div>
              </motion.div>
              
              {/* Connecting Line */}
              {index < flowSteps.length - 1 && (
                <div className="hidden md:block w-8 h-0.5 bg-white/30 mx-2"></div>
              )}
              {/* Vertical connecting line for mobile */}
              {index < flowSteps.length - 1 && (
                <div className="md:hidden w-0.5 h-4 bg-white/30 mt-2"></div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
});

interface HeroProps {
  primaryButtonHref?: string;
  onStepClick?: (stepId: number) => void;
}

export function Hero({
  primaryButtonHref = "/reco",
  onStepClick
}: HeroProps = {}) {
  // Locked copy as specified
  const heroTitle = "Freedom starts with a plan — let's build yours.";
  const heroSubtitle = "Find funding options for your business and build an application-ready Business Plan tailored to Grants, Investors or Bank Loans (DE/EN). Start free.";
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
      <div className="relative z-20 w-full max-w-6xl px-6 sm:px-8 lg:px-12 py-12 md:py-16 mx-auto">
        <div className="flex flex-col items-center space-y-12">
          
          {/* Text Content - Full Width */}
          <div className="text-center max-w-4xl">
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
              className="flex flex-col sm:flex-row gap-4 mb-6 justify-center"
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

          {/* User Flow Animation - Horizontal */}
          <div className="w-full">
            <UserFlowAnimation onStepClick={onStepClick} />
          </div>
        </div>
      </div>
    </section>
  );
}
