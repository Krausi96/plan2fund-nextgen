import { motion, useReducedMotion } from "framer-motion";
import { memo } from "react";
import { ClipboardList, BarChart2, LineChart, FileText, Target, Briefcase, Users, DollarSign, PieChart, Presentation, TrendingUp, type LucideIcon } from "lucide-react";

const icons = [
  ClipboardList, BarChart2, LineChart, FileText, Target,
  Briefcase, Users, DollarSign, PieChart, Presentation, TrendingUp
];

const FloatingIcon = memo(function FloatingIcon({ Icon, index }: { Icon: LucideIcon; index: number }) {
  const shouldReduceMotion = useReducedMotion();
  const driftX = (index % 2 === 0 ? 1 : -1) * (40 + index * 5);
  const driftY = (index % 2 === 0 ? -1 : 1) * (30 + index * 3);

  return (
    <motion.div
      className="absolute opacity-15"
      initial={{ x: 0, y: 0, opacity: 0 }}
      animate={shouldReduceMotion ? { opacity: 0.1 } : {
        x: [0, driftX, 0],
        y: [0, driftY, 0],
        opacity: [0.1, 0.3, 0.1],
        scale: [1, 1.05, 1]
      }}
      transition={shouldReduceMotion ? { duration: 0.1 } : {
        repeat: Infinity,
        duration: 14 + index * 2,
        ease: "easeInOut"
      }}
      style={{
        top: `${Math.random() * 80 + 5}%`,
        left: `${Math.random() * 80 + 10}%`
      }}
    >
      <Icon size={42} className="text-blue-400" />
    </motion.div>
  );
});


interface HeroProps {
  title?: string;
  subtitle?: string;
  primaryButtonText?: string;
  primaryButtonHref?: string;
}

export function Hero({
  title,
  subtitle,
  primaryButtonText,
  primaryButtonHref = "/editor"
}: HeroProps = {}) {
  const shouldReduceMotion = useReducedMotion();
  
  const heroTitle = title || "Freedom starts with a plan — let's build yours.";
  const heroSubtitle = subtitle || "Find Austrian/EU funding you're eligible for and draft a plan in minutes.";
  const heroPrimaryButton = primaryButtonText || "Start your plan";

  return (
    <section 
      className="relative min-h-[100vh] sm:min-h-[80vh] flex items-center justify-center overflow-hidden bg-gradient-to-b from-neutral-800 via-neutral-900 to-black"
      aria-label="Hero section with main value proposition"
    >
      {/* Stripe-style Background with Dotted Globe and Flowing Arcs */}
      <div className="absolute inset-0 overflow-hidden">
        <svg className="w-full h-full" viewBox="0 0 1200 800" preserveAspectRatio="xMidYMid slice">
          {/* Dotted Globe */}
          <g opacity="0.3">
            {/* Globe outline */}
            <circle cx="800" cy="400" r="180" fill="none" stroke="#60A5FA" strokeWidth="1" opacity="0.2" />
            {/* Dotted pattern for globe */}
            {Array.from({ length: 200 }, (_, i) => {
              const angle = (i / 200) * 2 * Math.PI;
              const radius = 160 + Math.random() * 40;
              const x = 800 + Math.cos(angle) * radius;
              const y = 400 + Math.sin(angle) * radius;
              return (
                <motion.circle
                  key={i}
                  cx={x}
                  cy={y}
                  r="1.5"
                  fill="#60A5FA"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 0.6 }}
                  transition={{ 
                    delay: i * 0.01,
                    duration: 0.5,
                    repeat: shouldReduceMotion ? 0 : Infinity,
                    repeatType: "reverse",
                    repeatDelay: 2
                  }}
                />
              );
            })}
          </g>

          {/* Flowing Arcs */}
          <g opacity="0.4">
            {/* Red arc */}
            <motion.path
              d="M200 600 Q500 300 800 200 Q1000 100 1000 400"
              fill="none"
              stroke="#EF4444"
              strokeWidth="2"
              initial={{ pathLength: 0, opacity: 0 }}
              animate={{ pathLength: 1, opacity: 0.6 }}
              transition={{ 
                duration: 8, 
                ease: "easeInOut",
                repeat: shouldReduceMotion ? 0 : Infinity,
                repeatDelay: 1
              }}
            />
            {/* Light blue arc */}
            <motion.path
              d="M100 400 Q400 350 700 400 Q900 450 1100 400"
              fill="none"
              stroke="#60A5FA"
              strokeWidth="1.5"
              initial={{ pathLength: 0, opacity: 0 }}
              animate={{ pathLength: 1, opacity: 0.5 }}
              transition={{ 
                duration: 6, 
                ease: "easeInOut",
                repeat: shouldReduceMotion ? 0 : Infinity,
                repeatDelay: 2
              }}
            />
            {/* Purple arc */}
            <motion.path
              d="M150 200 Q450 250 750 300 Q950 350 1050 500"
              fill="none"
              stroke="#A855F7"
              strokeWidth="1.5"
              initial={{ pathLength: 0, opacity: 0 }}
              animate={{ pathLength: 1, opacity: 0.5 }}
              transition={{ 
                duration: 7, 
                ease: "easeInOut",
                repeat: shouldReduceMotion ? 0 : Infinity,
                repeatDelay: 1.5
              }}
            />
            {/* Yellow arc */}
            <motion.path
              d="M300 100 Q600 150 900 200 Q1000 250 950 350"
              fill="none"
              stroke="#EAB308"
              strokeWidth="1"
              initial={{ pathLength: 0, opacity: 0 }}
              animate={{ pathLength: 1, opacity: 0.4 }}
              transition={{ 
                duration: 5, 
                ease: "easeInOut",
                repeat: shouldReduceMotion ? 0 : Infinity,
                repeatDelay: 3
              }}
            />
          </g>

          {/* Subtle starfield dots */}
          {Array.from({ length: 50 }, (_, i) => (
            <motion.circle
              key={`star-${i}`}
              cx={Math.random() * 1200}
              cy={Math.random() * 800}
              r="0.5"
              fill="#60A5FA"
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.3 }}
              transition={{ 
                delay: i * 0.1,
                duration: 2,
                repeat: shouldReduceMotion ? 0 : Infinity,
                repeatType: "reverse",
                repeatDelay: Math.random() * 5
              }}
            />
          ))}
        </svg>
      </div>

      {/* Floating Icons */}
      {icons.map((Icon, i) => (
        <FloatingIcon Icon={Icon} index={i} key={i} />
      ))}

      {/* Main Content Grid */}
      <div className="relative z-20 w-full max-w-7xl px-4 sm:px-6 grid lg:grid-cols-2 gap-12 items-center">
        {/* Left Content */}
        <div className="text-left">
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
            className="text-xl text-neutral-300 mb-8 max-w-2xl"
          >
            {heroSubtitle}
          </motion.p>

          {/* CTA Buttons */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, duration: 0.8 }}
            className="mb-8 flex flex-col sm:flex-row gap-4"
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

        {/* Right Content - Data Proof Box */}
        <div className="flex justify-center lg:justify-end">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.8 }}
            className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20 max-w-md"
          >
            <h3 className="text-xl font-semibold text-white mb-4 text-center">
              Data-Driven Results
            </h3>
            <div className="space-y-4">
              <div className="text-sm text-blue-200">
                <div className="font-medium text-white mb-1">Austria ranks among the top EU countries for innovation funding per capita</div>
                <div className="text-xs text-gray-300">European Innovation Scoreboard</div>
              </div>
              <div className="text-sm text-blue-200">
                <div className="font-medium text-white mb-1">90% of Austrian companies are SMEs — many rely on grants and co-funding</div>
                <div className="text-xs text-gray-300">Statistik Austria, WKO</div>
              </div>
              <div className="text-sm text-blue-200">
                <div className="font-medium text-white mb-1">Entrepreneurs with a business plan are 2x more likely to secure funding</div>
                <div className="text-xs text-gray-300">HBR, OECD</div>
              </div>
              <div className="text-sm text-blue-200">
                <div className="font-medium text-white mb-1">Horizon Europe provides €95B in funding until 2027</div>
                <div className="text-xs text-gray-300">European Commission</div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
