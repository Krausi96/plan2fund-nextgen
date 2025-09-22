import { motion } from "framer-motion";
import { Building2, Rocket, Palette, GraduationCap } from "lucide-react";

const audiences = [
  {
    icon: Building2,
    title: "SMEs & Established Businesses",
    description: "Scale your existing business with strategic funding and expansion plans.",
    features: ["Growth funding", "Market expansion", "Technology upgrades"],
    color: "text-blue-600",
    bgColor: "bg-blue-50",
  },
  {
    icon: Rocket,
    title: "Startups & Entrepreneurs",
    description: "Turn your innovative ideas into reality with comprehensive business planning.",
    features: ["Pre-seed funding", "MVP development", "Market validation"],
    color: "text-green-600",
    bgColor: "bg-green-50",
  },
  {
    icon: Palette,
    title: "Creative Professionals",
    description: "Secure funding for creative projects and cultural initiatives.",
    features: ["Arts funding", "Cultural projects", "Creative grants"],
    color: "text-purple-600",
    bgColor: "bg-purple-50",
  },
  {
    icon: GraduationCap,
    title: "Students & Researchers",
    description: "Access research grants and academic funding opportunities.",
    features: ["Research grants", "Academic funding", "Innovation projects"],
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
            Whether you're a startup, SME, creative professional, or researcher, 
            we have the tools and funding programs for you.
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
          <div>
            <div className="text-3xl font-bold text-primary-600 mb-2">500+</div>
            <div className="text-neutral-600">Active Users</div>
          </div>
          <div>
            <div className="text-3xl font-bold text-primary-600 mb-2">214+</div>
            <div className="text-neutral-600">Funding Programs</div>
          </div>
          <div>
            <div className="text-3xl font-bold text-primary-600 mb-2">€1B+</div>
            <div className="text-neutral-600">Available Funding</div>
          </div>
          <div>
            <div className="text-3xl font-bold text-primary-600 mb-2">95%</div>
            <div className="text-neutral-600">Success Rate</div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
