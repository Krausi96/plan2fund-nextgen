import { motion } from "framer-motion";
import { Building2, Rocket, Palette, GraduationCap } from "lucide-react";
import { Counter } from "./Counter";

const audiences = [
  {
    icon: Building2,
    title: "Austrian SMEs & Established Businesses",
    description: "Scale your existing business with Austrian and EU funding programs for growth and expansion.",
    features: ["AWS funding programs", "EU Horizon projects", "Regional development grants"],
    color: "text-blue-600",
    bgColor: "bg-blue-50",
  },
  {
    icon: Rocket,
    title: "Austrian Startups & Entrepreneurs",
    description: "Turn your innovative ideas into reality with comprehensive Austrian startup funding support.",
    features: ["AWS PreSeed funding", "Startup grants", "Innovation vouchers"],
    color: "text-green-600",
    bgColor: "bg-green-50",
  },
  {
    icon: Palette,
    title: "Creative Professionals & Artists",
    description: "Secure Austrian cultural funding for creative projects and artistic initiatives.",
    features: ["Austrian cultural grants", "EU Creative Europe", "Regional arts funding"],
    color: "text-purple-600",
    bgColor: "bg-purple-50",
  },
  {
    icon: GraduationCap,
    title: "Researchers & Academic Institutions",
    description: "Access Austrian research grants and EU academic funding opportunities.",
    features: ["FFG research grants", "EU Horizon Europe", "Austrian Academy funding"],
    color: "text-orange-600",
    bgColor: "bg-orange-50",
  },
];

export function WhoItsFor() {
  return (
    <section className="section-padding bg-white">
      <div className="container">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl font-bold text-neutral-900 mb-4">
            Who it's for
          </h2>
          <p className="text-xl text-neutral-600 max-w-2xl mx-auto">
            Whether you're an Austrian startup, SME, creative professional, or researcher, 
            we have the tools and Austrian/EU funding programs for you.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {audiences.map((audience, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              viewport={{ once: true }}
              className="card-hover group"
            >
              {/* Icon */}
              <div className={`w-12 h-12 ${audience.bgColor} rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-200`}>
                <audience.icon className={`w-6 h-6 ${audience.color}`} />
              </div>
              
              {/* Content */}
              <h3 className="text-xl font-semibold text-neutral-900 mb-3">
                {audience.title}
              </h3>
              <p className="text-neutral-600 mb-4 leading-relaxed">
                {audience.description}
              </p>
              
              {/* Features */}
              <ul className="space-y-2">
                {audience.features.map((feature, featureIndex) => (
                  <li key={featureIndex} className="flex items-center text-sm text-neutral-600">
                    <svg className="w-4 h-4 text-green-500 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    {feature}
                  </li>
                ))}
              </ul>
            </motion.div>
          ))}
        </div>

        {/* Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          viewport={{ once: true }}
          className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-8 text-center"
        >
          <Counter
            value={500}
            label="Active Users"
            description="Austrian entrepreneurs"
            delay={0.1}
          />
          <Counter
            value={214}
            label="Funding Programs"
            description="Austrian & EU programs"
            delay={0.2}
          />
          <Counter
            value={1000000000}
            label="Available Funding"
            description="€1B+ total funding"
            delay={0.3}
          />
          <Counter
            value={95}
            label="Success Rate"
            description="Funding applications"
            delay={0.4}
          />
        </motion.div>
      </div>
    </section>
  );
}
