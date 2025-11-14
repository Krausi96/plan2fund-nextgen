import { memo, useState, useEffect } from "react";
import { useI18n } from "@/shared/contexts/I18nContext";
import { detectTargetGroup } from '@/shared/user/segmentation';
import TargetGroupBanner from '@/shared/user/components/TargetGroupBanner';


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
  // Removed useReducedMotion - using CSS @media (prefers-reduced-motion) instead
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
      icon: "💰", 
      description: t('hero.steps.funding.description'),
      color: "from-purple-500 to-pink-500"
    },
    { 
      id: 4, 
      title: t('hero.steps.plan.title'), 
      icon: "📋", 
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
    const interval = setInterval(() => {
      setCurrentStep((prev) => (prev + 1) % flowSteps.length);
    }, 5000); // Increased from 3000ms to 5000ms for slower animation
    
    return () => clearInterval(interval);
  }, [flowSteps.length]);

  return (
    <div className="relative w-full flex items-center justify-center p-4">
      <div className="relative w-full max-w-4xl">
        {/* Horizontal Flow Container */}
        <div className="flex flex-col md:flex-row items-center justify-center space-y-4 md:space-y-0 md:space-x-4">
          {/* Flow Steps */}
          {flowSteps.map((step, index) => (
            <div key={step.id} className="relative flex items-center">
              <div
                className={`hero-fade-in-up hero-interactive-hover relative p-3 rounded-lg bg-white/5 backdrop-blur-sm border transition-all duration-500 cursor-pointer hover:bg-white/10 hover:border-white/30 ${
                  currentStep === index 
                    ? 'border-white/40 bg-white/10 scale-105' 
                    : 'border-white/10'
                }`}
                style={{ 
                  width: '120px', 
                  minHeight: '100px',
                  animationDelay: `${0.2 + (index * 0.1)}s`
                }}
                onClick={() => onStepClick?.(step.id)}
              >
                {/* Step Icon */}
                <div 
                  className={`mx-auto mb-1 rounded-full flex items-center justify-center text-white font-bold transition-transform duration-300 ${
                    currentStep === index ? 'w-7 h-7 text-sm scale-110' : 'w-6 h-6 text-xs'
                  }`}
                  style={{
                    background: `linear-gradient(135deg, ${step.color.includes('blue') ? '#3B82F6' : step.color.includes('green') ? '#10B981' : step.color.includes('purple') ? '#8B5CF6' : step.color.includes('orange') ? '#F59E0B' : '#EAB308'}, ${step.color.includes('blue') ? '#06B6D4' : step.color.includes('green') ? '#059669' : step.color.includes('purple') ? '#A855F7' : step.color.includes('orange') ? '#EF4444' : '#F97316'})`
                  }}
                >
                  {step.icon}
                </div>
                
                {/* Step Content */}
                <div className="text-center flex flex-col justify-center h-full">
                  <h3 className="text-xs font-bold text-white mb-1 line-clamp-2">
                    {step.title}
                  </h3>
                  <p className="text-[10px] text-blue-200/80 leading-tight line-clamp-3 overflow-hidden">
                    {step.description}
                  </p>
                </div>
              </div>
              
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

// Enhanced target group detection with external traffic support
function getTargetGroupFromDetection(): string {
  const detection = detectTargetGroup();
  return detection.targetGroup;
}

interface HeroProps {
  primaryButtonHref?: string;
  onStepClick?: (stepId: number) => void;
  onTargetGroupSelect?: (targetGroup: string) => void;
  targetGroup?: string;
}

export function Hero({
  primaryButtonHref = "/reco",
  onStepClick,
  onTargetGroupSelect,
  targetGroup: propTargetGroup
}: HeroProps = {}) {
  const { t } = useI18n();
  const [selectedTargetGroup, setSelectedTargetGroup] = useState<string | null>(null);
  
  // Get target group: prop > selected from banner > detection
  const targetGroup = propTargetGroup || selectedTargetGroup || getTargetGroupFromDetection();

  // Handle target group selection from banner
  const handleTargetGroupSelect = (targetGroup: string) => {
    setSelectedTargetGroup(targetGroup);
    // Notify parent component
    if (onTargetGroupSelect) {
      onTargetGroupSelect(targetGroup);
    }
  };
  
  // Get target group specific content or fallback to default
  const heroTitle = targetGroup !== 'default' ? t(`hero.title.${targetGroup}` as any) : t('hero.title.main');
  const heroTitleSecond = targetGroup === 'default' ? t('hero.titleSecond') : '';
  const heroSubtitle = targetGroup !== 'default' ? t(`hero.subtitle.${targetGroup}` as any) : t('hero.subtitle.main');
  const heroPrimaryButton = t('hero.button.primary');
  const heroSecondaryButton = t('hero.button.secondary');

  return (
    <section 
      className="relative min-h-[50vh] flex items-center overflow-hidden bg-gradient-to-b from-blue-600 via-blue-700 to-blue-800"
      aria-label="Hero section with main value proposition"
    >
      {/* Background - Blueprint grid overlay on blue gradient */}
      <BlueprintGrid />

      {/* Main Content */}
      <div className="relative z-20 w-full max-w-6xl px-6 sm:px-8 lg:px-12 py-6 md:py-8 mx-auto">
                <div className="flex flex-col items-center justify-center space-y-8 min-h-[50vh] pt-8">
          
          {/* Target Group Banner - Always show for testing */}
          <TargetGroupBanner onTargetGroupSelect={handleTargetGroupSelect} />
          
          {/* H1 + Subtitle as one visual block */}
          <div className="text-center max-w-5xl">
            <div className="hero-fade-in-up-large mb-12">
              {/* H1 Title - Tight line-height for compact feel when breaking */}
              <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-bold text-white leading-tight sm:leading-tight text-wrap-balance tracking-tight">
                <div className="mb-0">{heroTitle}</div>
                {heroTitleSecond && <div className="text-white text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-bold leading-tight">. . . {heroTitleSecond}</div>}
              </h1>
              
              {/* Fixed spacing between H1 and subtitle - consistent 28px */}
              <div className="mt-7">
                {/* Subtitle - increased width for better proportions */}
                <div className="text-center max-w-4xl mx-auto">
                  <div>
                    <p 
                      className="hero-staggered-1 text-lg md:text-xl text-white/90 leading-relaxed font-normal"
                      dangerouslySetInnerHTML={{
                        __html: heroSubtitle
                          .replace(/(funding options|Finanzierungsoptionen)/gi, '<span class="font-bold text-white">$1</span>')
                          .replace(/(application-ready Business Plan|antragsfertigen Businessplan)/gi, '<span class="font-bold text-white">$1</span>')
                          .replace(/(Business Plans|Businesspläne)/gi, '<span class="font-bold text-white">$1</span>')
                          .replace(/(Business Plan|Businessplan)/gi, '<span class="font-bold text-white">$1</span>')
                          .replace(/(research|Recherche)/gi, '<span class="font-bold text-white">$1</span>')
                          .replace(/(drafting|Erstellung)/gi, '<span class="font-bold text-white">$1</span>')
                          .replace(/(formatting|Formatierung)/gi, '<span class="font-bold text-white">$1</span>')
                          .replace(/(finalization|Nachbearbeitung)/gi, '<span class="font-bold text-white">$1</span>')
                          .replace(/(Save hours|Spare Stunden)/gi, '<span class="font-bold text-white">$1</span>')
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* User Flow Animation - Hidden on mobile */}
          <div className="w-full max-w-2xl hidden md:block -mt-8">
            <UserFlowAnimation onStepClick={onStepClick} />
          </div>

          {/* CTA Buttons and Disclaimer */}
          <div className="text-center max-w-4xl">
            {/* CTA Buttons */}
            <div className="hero-staggered-2 flex flex-col sm:flex-row gap-3 mb-3 justify-center">
              <a
                href={primaryButtonHref}
                className="hero-button-hover inline-flex items-center justify-center px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl transition-colors duration-200 shadow-lg hover:shadow-xl"
              >
                {heroPrimaryButton}
              </a>
              
              <a
                href="/editor"
                className="hero-button-hover hidden sm:inline-flex items-center justify-center px-8 py-4 border-2 border-white/30 hover:border-white/50 text-white font-semibold rounded-xl transition-colors duration-200 backdrop-blur-sm hover:bg-white/10"
              >
                {heroSecondaryButton}
              </a>
            </div>

            {/* Safety Microcopy */}
            <p 
              className="hero-staggered-3 text-xs text-blue-200/70 max-w-xl mx-auto"
            >
              {t('hero.disclaimer')}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
