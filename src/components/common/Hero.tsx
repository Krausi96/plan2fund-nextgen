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
      title: "Find Programs", 
      icon: "🔍", 
      description: "Answer questions → Discover 214+ funding programs",
      color: "from-blue-500 to-cyan-500",
      bgGlow: "bg-blue-500/20"
    },
    { 
      id: 2, 
      title: "Draft Plan", 
      icon: "📝", 
      description: "Program-aware editor → Create plan in <30 min",
      color: "from-green-500 to-emerald-500",
      bgGlow: "bg-green-500/20"
    },
    { 
      id: 3, 
      title: "Submit & Track", 
      icon: "🚀", 
      description: "Submit application → Track progress to success",
      color: "from-purple-500 to-pink-500",
      bgGlow: "bg-purple-500/20"
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
    <div className="relative w-full h-full flex items-center justify-center p-6">
      <div className="relative w-full max-w-sm">
        {/* Floating Background Elements */}
        <div className="absolute inset-0 overflow-hidden">
          {[...Array(6)].map((_, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, scale: 0 }}
              animate={{ 
                opacity: [0, 0.3, 0],
                scale: [0, 1, 0],
                x: [0, Math.random() * 200 - 100],
                y: [0, Math.random() * 200 - 100]
              }}
              transition={{
                duration: 4,
                delay: i * 0.5,
                repeat: Infinity,
                repeatDelay: 2
              }}
              className="absolute w-2 h-2 bg-white/20 rounded-full"
              style={{
                left: `${20 + i * 15}%`,
                top: `${30 + i * 10}%`
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
                duration: 20,
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
              const angle = (index * 120) - 90; // 120 degrees apart
              const radius = 120;
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
                    delay: shouldReduceMotion ? 0 : 0.8 + (index * 0.3),
                    duration: 0.6,
                    type: "spring",
                    stiffness: 100
                  }}
                  className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2"
                  style={{
                    transform: `translate(calc(-50% + ${x}px), calc(-50% + ${y}px))`
                  }}
                >
                  {/* Step Card */}
                  <motion.div
                    whileHover={{ scale: 1.05 }}
                    className={`relative p-4 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 shadow-xl ${step.bgGlow} transition-all duration-300 ${
                      currentStep === index ? 'ring-2 ring-white/50' : ''
                    }`}
                    style={{ width: '140px' }}
                  >
                    {/* Step Icon */}
                    <motion.div
                      animate={{ 
                        scale: currentStep === index ? [1, 1.2, 1] : 1,
                        rotate: currentStep === index ? [0, 10, -10, 0] : 0
                      }}
                      transition={{ 
                        duration: 0.6,
                        repeat: currentStep === index ? Infinity : 0,
                        repeatDelay: 2
                      }}
                      className={`w-10 h-10 mx-auto mb-3 bg-gradient-to-br ${step.color} rounded-full flex items-center justify-center text-white text-lg font-bold shadow-lg`}
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

                    {/* Connection Line to Center */}
                    <motion.div
                      initial={{ scaleX: 0 }}
                      animate={{ scaleX: 1 }}
                      transition={{ 
                        delay: shouldReduceMotion ? 0 : 1.2 + (index * 0.2),
                        duration: 0.8
                      }}
                      className="absolute top-1/2 left-1/2 w-16 h-0.5 bg-gradient-to-r from-white/30 to-transparent origin-left"
                      style={{
                        transform: `translate(-50%, -50%) rotate(${angle}deg)`
                      }}
                    />
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
      <div className="relative z-20 w-full max-w-8xl px-4 py-16 md:py-20 mx-auto">
        <div className="grid md:grid-cols-[8fr_4fr] xl:grid-cols-[9fr_3fr] gap-8 md:gap-12 items-center">
          
          {/* Text Content - Left Column (much wider) */}
          <div className="text-left max-w-[85ch]">
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