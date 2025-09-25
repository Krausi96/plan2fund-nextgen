import { motion, useReducedMotion } from "framer-motion";
import { memo, useState, useEffect } from "react";
import { useI18n } from "@/contexts/I18nContext";

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
  const { t } = useI18n();

  const flowSteps = [
    { 
      id: 1, 
      title: t('hero.steps.idea.title'), 
      icon: "💡", 
      description: t('hero.steps.idea.description'),
      color: "from-blue-500 to-cyan-500"
    },
    { 
      id: 2, 
      title: t('hero.steps.business.title'), 
      icon: "🏢", 
      description: t('hero.steps.business.description'),
      color: "from-green-500 to-emerald-500"
    },
    { 
      id: 3, 
      title: t('hero.steps.funding.title'), 
      icon: "🔍", 
      description: t('hero.steps.funding.description'),
      color: "from-purple-500 to-pink-500"
    },
    { 
      id: 4, 
      title: t('hero.steps.plan.title'), 
      icon: "📝", 
      description: t('hero.steps.plan.description'),
      color: "from-orange-500 to-red-500"
    },
    { 
      id: 5, 
      title: t('hero.steps.submit.title'), 
      icon: "🚀", 
      description: t('hero.steps.submit.description'),
      color: "from-yellow-500 to-orange-500"
    }
  ];

  // Auto-advance through steps - slower animation
  useEffect(() => {
    if (shouldReduceMotion) return;
    
    const interval = setInterval(() => {
      setCurrentStep((prev) => (prev + 1) % flowSteps.length);
    }, 5000); // Increased from 3000ms to 5000ms for slower animation
    
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
                className={`relative p-4 rounded-lg bg-white/5 backdrop-blur-sm border transition-all duration-500 cursor-pointer hover:bg-white/10 hover:border-white/30 ${
                  currentStep === index 
                    ? 'border-white/40 bg-white/10 scale-105' 
                    : 'border-white/10'
                }`}
                style={{ width: '140px' }}
                onClick={() => onStepClick?.(step.id)}
              >
                {/* Step Icon */}
                <motion.div 
                  className={`mx-auto mb-2 bg-white/20 rounded-full flex items-center justify-center text-white font-bold ${
                    currentStep === index ? 'w-8 h-8 text-base' : 'w-7 h-7 text-sm'
                  }`}
                  animate={{
                    scale: currentStep === index ? 1.1 : 1,
                  }}
                  transition={{ duration: 0.3 }}
                >
                  {step.icon}
                </motion.div>
                
                {/* Step Content */}
                <div className="text-center">
                  <h3 className="text-sm font-bold text-white mb-1">
                    {step.title}
                  </h3>
                  <p className="text-xs text-blue-200/80 leading-tight">
                    {step.description}
                  </p>
                </div>
              </motion.div>
              
              {/* Connecting Line */}
              {index < flowSteps.length - 1 && (
                <div className="hidden md:block w-6 h-0.5 bg-white/20 mx-2"></div>
              )}
              {/* Vertical connecting line for mobile */}
              {index < flowSteps.length - 1 && (
                <div className="md:hidden w-0.5 h-3 bg-white/20 mt-2"></div>
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
  const { t } = useI18n();
  
  // Locked copy as specified
  const heroTitle = t('hero.title.main');
  const heroTitleSecond = t('hero.titleSecond');
  const heroPrimaryButton = t('hero.button.primary');
  const heroSecondaryButton = t('hero.button.secondary');

  return (
    <section 
      className="relative min-h-[60vh] flex items-center overflow-hidden bg-gradient-to-b from-slate-900 via-blue-900 to-slate-800"
      aria-label="Hero section with main value proposition"
    >
      {/* Background */}
      <BlueprintGrid />

      {/* Main Content */}
      <div className="relative z-20 w-full max-w-6xl px-6 sm:px-8 lg:px-12 py-6 md:py-8 mx-auto">
        <div className="flex flex-col items-center justify-center space-y-8 min-h-[60vh]">
          
          {/* H1 Title - Moved up and more centered */}
          <div className="text-center max-w-4xl">
            <motion.h1 
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              className="text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-extrabold text-white leading-tight mb-8 text-wrap-balance tracking-tight xl:tracking-tighter"
              style={{ textWrap: 'balance' }}
            >
              <div>{heroTitle}</div>
              <div className="text-white">{heroTitleSecond}</div>
            </motion.h1>
          </div>

          {/* User Flow Animation - Horizontal */}
          <div className="w-full mb-4">
            <UserFlowAnimation onStepClick={onStepClick} />
          </div>

          {/* Subtitle - Moved below animation with larger font and highlighted text */}
          <div className="text-center max-w-4xl">
            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.8 }}
              className="text-xl md:text-2xl text-blue-100 mb-6 leading-relaxed"
            >
              <span className="font-semibold text-blue-200">Find funding options</span> for your business and <span className="font-semibold text-blue-200">build an application-ready Business Plan</span> tailored to Grants, Investors or Bank Loans (DE/EN). Start free.
            </motion.p>
          </div>

          {/* CTA Buttons and Disclaimer */}
          <div className="text-center max-w-4xl">
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
              {t('hero.disclaimer')}
            </motion.p>
          </div>
        </div>
      </div>
    </section>
  );
}
