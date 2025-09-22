import { motion } from "framer-motion";
import { Target, Search, FileCheck, TrendingUp } from "lucide-react";

const features = [
  {
    icon: Target,
    title: "Traceable Eligibility",
    description: "Every recommendation comes with clear reasoning and traceable eligibility criteria, so you know exactly why you qualify.",
    color: "text-blue-600",
    bgColor: "bg-blue-50",
  },
  {
    icon: Search,
    title: "Program-Aware Editor",
    description: "Our editor understands funding program requirements and guides you to create plans that meet specific criteria.",
    color: "text-green-600",
    bgColor: "bg-green-50",
  },
  {
    icon: FileCheck,
    title: "Counterfactuals & Analysis",
    description: "Get detailed analysis of what-if scenarios and counterfactuals to strengthen your funding applications.",
    color: "text-purple-600",
    bgColor: "bg-purple-50",
  },
  {
    icon: TrendingUp,
    title: "Proven Results",
    description: "Join 500+ founders who have successfully secured funding using our platform and methodology.",
    color: "text-orange-600",
    bgColor: "bg-orange-50",
  },
];

export function WhyPlan2Fund() {
  return (
    <section className="section-padding bg-gradient-to-br from-primary-50 to-blue-50">
      <div className="container">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl font-bold text-neutral-900 mb-4">
            Why Plan2Fund?
          </h2>
          <p className="text-xl text-neutral-600 max-w-3xl mx-auto">
            We're not just another business plan generator. We're your strategic partner 
            in finding and securing the right funding for your venture.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 gap-8 lg:gap-12">
          {features.map((feature, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, x: index % 2 === 0 ? -30 : 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              viewport={{ once: true }}
              className="flex gap-6"
            >
              {/* Icon */}
              <div className={`w-14 h-14 ${feature.bgColor} rounded-xl flex items-center justify-center flex-shrink-0`}>
                <feature.icon className={`w-7 h-7 ${feature.color}`} />
              </div>
              
              {/* Content */}
              <div>
                <h3 className="text-xl font-semibold text-neutral-900 mb-3">
                  {feature.title}
                </h3>
                <p className="text-neutral-600 leading-relaxed">
                  {feature.description}
                </p>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Testimonial Quote */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          viewport={{ once: true }}
          className="mt-16 text-center"
        >
          <div className="max-w-4xl mx-auto">
            <blockquote className="text-2xl font-medium text-neutral-800 mb-6 italic">
              "Plan2Fund helped us identify 12 funding programs we never knew existed. 
              We secured €150,000 in grants within 3 months of using the platform."
            </blockquote>
            <div className="flex items-center justify-center gap-4">
              <div className="w-12 h-12 bg-primary-600 rounded-full flex items-center justify-center text-white font-semibold">
                M.S.
              </div>
              <div className="text-left">
                <div className="font-semibold text-neutral-900">Maria Schmidt</div>
                <div className="text-neutral-600">Founder, TechStart Vienna</div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
