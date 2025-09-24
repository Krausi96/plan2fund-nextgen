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

// Advanced User Flow Animation Component
const UserFlowAnimation = memo(function UserFlowAnimation() {
  const shouldReduceMotion = useReducedMotion();
  const [currentStep, setCurrentStep] = useState(0);

  const flowSteps = [
    { 
      id: 1, 
      title: "Idea", 
      icon: "💡", 
      description: "Your business concept",
      color: "from-blue-500 to-cyan-500",
      bgGlow: "bg-blue-500/20"
    },
    { 
      id: 2, 
      title: "Develop Business Model", 
      icon: "📊", 
      description: "Get market ready",
      color: "from-green-500 to-emerald-500",
      bgGlow: "bg-green-500/20"
    },
    { 
      id: 3, 
      title: "Funding", 
      icon: "💰", 
      description: "Secure funding for your business",
      color: "from-purple-500 to-pink-500",
      bgGlow: "bg-purple-500/20"
    },
    { 
      id: 4, 
      title: "Create Business Plan", 
      icon: "📝", 
      description: "Prepare funding ready documents",
      color: "from-orange-500 to-red-500",
      bgGlow: "bg-orange-500/20"
    },
    { 
      id: 5, 
      title: "Submit Plan", 
      icon: "🚀", 
      description: "Receive funding",
      color: "from-indigo-500 to-purple-500",
      bgGlow: "bg-indigo-500/20"
    }
  ];

  // Auto-advance through steps (slower, more appealing)
  useEffect(() => {
    if (shouldReduceMotion) return;
    
    const interval = setInterval(() => {
      setCurrentStep((prev) => (prev + 1) % flowSteps.length);
    }, 5000); // Increased from 3000 to 5000ms for slower, more appealing timing
    
    return () => clearInterval(interval);
  }, [shouldReduceMotion, flowSteps.length]);

  return (
    <div className="relative w-full h-full flex items-center justify-center p-6">
      <div className="relative w-full max-w-sm">
        {/* Floating Background Elements */}
        <div className="absolute inset-0 overflow-hidden">
          {[...Array(8)].map((_, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, scale: 0 }}
              animate={{ 
                opacity: [0, 0.4, 0],
                scale: [0, 1.2, 0],
                x: [0, Math.random() * 300 - 150],
                y: [0, Math.random() * 300 - 150]
              }}
              transition={{
                duration: 6, // Slower, more appealing
                delay: i * 0.8, // More staggered timing
                repeat: Infinity,
                repeatDelay: 4 // Longer delay between cycles
              }}
              className="absolute w-3 h-3 bg-white/25 rounded-full"
              style={{
                left: `${15 + i * 12}%`,
                top: `${25 + i * 8}%`
              }}
            />
          ))}
        </div>

        {/* Main Flow Container */}
        <div className="relative z-10">
          {/* Central Hub */}
          <motion.div
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ 
              delay: shouldReduceMotion ? 0 : 0.5,
              duration: 0.8,
              type: "spring",
              stiffness: 100
            }}
            className="w-20 h-20 mx-auto mb-8 bg-gradient-to-br from-blue-600 via-purple-600 to-pink-600 rounded-full flex items-center justify-center shadow-2xl"
          >
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ 
                duration: 30, // Slower rotation for more appealing effect
                repeat: Infinity,
                ease: "linear"
              }}
              className="text-2xl"
            >
              ⚡
            </motion.div>
          </motion.div>

          {/* Flow Steps in Circular Layout */}
          <div className="relative">
            {flowSteps.map((step, index) => {
              const angle = (index * 72) - 90; // 72 degrees apart for 5 steps (360/5)
              const radius = 140; // Slightly larger radius for 5 steps
              const x = Math.cos(angle * Math.PI / 180) * radius;
              const y = Math.sin(angle * Math.PI / 180) * radius;
              
              return (
                <motion.div
                  key={step.id}
                  initial={{ 
                    opacity: 0, 
                    scale: 0,
                    x: 0,
                    y: 0
                  }}
                  animate={{ 
                    opacity: 1, 
                    scale: currentStep === index ? 1.1 : 1,
                    x: x,
                    y: y
                  }}
                  transition={{ 
                    delay: shouldReduceMotion ? 0 : 1.0 + (index * 0.4), // Slower, more appealing timing
                    duration: 0.8, // Increased duration for smoother animation
                    type: "spring",
                    stiffness: 80 // Reduced stiffness for more fluid motion
                  }}
                  className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2"
                  style={{
                    transform: `translate(calc(-50% + ${x}px), calc(-50% + ${y}px))`
                  }}
                >
                    {/* Step Card */}
                    <motion.div
                      whileHover={{ scale: 1.05 }}
                      className={`relative p-4 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 shadow-xl ${step.bgGlow} transition-all duration-500 ${
                        currentStep === index ? 'ring-2 ring-white/50 scale-110' : ''
                      }`}
                      style={{ width: '150px' }}
                    >
                      {/* Step Icon */}
                      <motion.div
                        animate={{ 
                          scale: currentStep === index ? [1, 1.3, 1] : 1,
                          rotate: currentStep === index ? [0, 15, -15, 0] : 0
                        }}
                        transition={{ 
                          duration: 1.0, // Slower, more appealing
                          repeat: currentStep === index ? Infinity : 0,
                          repeatDelay: 3 // Longer delay between repeats
                        }}
                        className={`w-12 h-12 mx-auto mb-3 bg-gradient-to-br ${step.color} rounded-full flex items-center justify-center text-white text-xl font-bold shadow-lg`}
                      >
                        {step.icon}
                      </motion.div>
                      
                      {/* Step Content */}
                      <div className="text-center">
                        <h3 className="text-sm font-bold text-white mb-1 leading-tight">
                          {step.title}
                        </h3>
                        <p className="text-xs text-blue-200 leading-tight">
                          {step.description}
                        </p>
                      </div>
                    </motion.div>
                </motion.div>
              );
            })}
          </div>

          {/* Success Pulse Effect */}
          <motion.div
            animate={{ 
              scale: [1, 1.2, 1],
              opacity: [0.3, 0.6, 0.3]
            }}
            transition={{ 
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut"
            }}
            className="absolute inset-0 rounded-full bg-gradient-to-r from-blue-500/20 via-purple-500/20 to-pink-500/20"
          />
        </div>
      </div>
    </div>
  );
});



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
      className="relative min-h-[80vh] flex items-center overflow-hidden"
      aria-label="Hero section with main value proposition"
    >
      {/* Background */}
      <BlueprintGrid />

      {/* Main Content */}
      <div className="relative z-20 w-full max-w-9xl px-4 py-16 md:py-20 mx-auto">
        <div className="grid md:grid-cols-[9fr_3fr] xl:grid-cols-[10fr_2fr] gap-8 md:gap-12 items-center">
          
          {/* Text Content - Left Column (even wider) */}
          <div className="text-left max-w-[95ch]">
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