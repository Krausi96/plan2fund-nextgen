import { motion } from "framer-motion";
import { Building2, Rocket, Palette, GraduationCap } from "lucide-react";

const audiences = [
  {
    icon: Building2,
    title: "Visa Applications",
    description: "e.g. RWR, Freelance Permit - Create professional business plans for visa applications.",
    features: ["RWR visa support", "Freelance permit applications", "Business plan compliance"],
    color: "text-blue-600",
    bgColor: "bg-blue-50",
    emoji: "🗂",
    details: {
      programs: [
        { name: "RWR Visa", amount: "Up to €50,000", description: "Red-White-Red Card for skilled workers" },
        { name: "Freelance Permit", amount: "€25,000", description: "Self-employment authorization" }
      ],
      benefits: ["Business plan compliance", "Documentation support", "Legal requirements"],
      cta: "Start Visa Application"
    }
  },
  {
    icon: Rocket,
    title: "Grants & Public Funding",
    description: "AWS PreSeed, FFG, EU startup calls - Access comprehensive Austrian and EU funding programs.",
    features: ["AWS PreSeed funding", "FFG research grants", "EU startup programs"],
    color: "text-green-600",
    bgColor: "bg-green-50",
    emoji: "🧬",
    details: {
      programs: [
        { name: "AWS PreSeed", amount: "Up to €50,000", description: "Early-stage startup funding" },
        { name: "FFG Research", amount: "Up to €200,000", description: "Research and development grants" },
        { name: "EU Horizon", amount: "Up to €2M", description: "European innovation programs" }
      ],
      benefits: ["No repayment required", "Expert guidance", "Network access"],
      cta: "Find Grants"
    }
  },
  {
    icon: Palette,
    title: "Bank Loans or Leasing",
    description: "Structured + formatted to meet financial standards for traditional financing.",
    features: ["Bank loan applications", "Leasing agreements", "Financial compliance"],
    color: "text-purple-600",
    bgColor: "bg-purple-50",
    emoji: "📊",
    details: {
      programs: [
        { name: "ERP Credit", amount: "Up to €500,000", description: "Low-interest business loans" },
        { name: "Leasing", amount: "Up to €1M", description: "Equipment and asset financing" },
        { name: "Guarantees", amount: "Up to €2M", description: "Government-backed guarantees" }
      ],
      benefits: ["Low interest rates", "Flexible terms", "Quick approval"],
      cta: "Apply for Loan"
    }
  },
  {
    icon: GraduationCap,
    title: "Startup, Coaching or Projects",
    description: "Ideas, Self-employment, or consultant-supported projects for all business types.",
    features: ["Startup projects", "Self-employment plans", "Consultant support"],
    color: "text-orange-600",
    bgColor: "bg-orange-50",
    emoji: "👥",
    details: {
      programs: [
        { name: "Startup Coaching", amount: "€5,000", description: "Business development support" },
        { name: "Innovation Vouchers", amount: "€10,000", description: "Consulting and R&D support" },
        { name: "Project Funding", amount: "€25,000", description: "Specific project implementation" }
      ],
      benefits: ["Expert mentoring", "Network access", "Validation support"],
      cta: "Start Project"
    }
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
            🧾 Use Cases
          </h2>
          <p className="text-xl text-neutral-600 max-w-2xl mx-auto">
            Whether you're applying for visas, seeking grants, securing loans, or starting projects, 
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
              className="group perspective-1000"
            >
              {/* Flip Card Container */}
              <div className="relative w-full h-80 [transform-style:preserve-3d] group-hover:[transform:rotateY(180deg)] transition-transform duration-700">
                
                {/* Front Side */}
                <div className="absolute inset-0 w-full h-full [backface-visibility:hidden] card-hover">
                  {/* Icon */}
                  <div className={`w-12 h-12 ${audience.bgColor} rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-200`}>
                    <audience.icon className={`w-6 h-6 ${audience.color}`} />
                  </div>
                  
                  {/* Emoji */}
                  <div className="text-4xl mb-4">{audience.emoji}</div>
                  
                  {/* Content */}
                  <h3 className="text-xl font-semibold text-neutral-900 mb-3">
                    {audience.title}
                  </h3>
                  <p className="text-neutral-600 mb-4 leading-relaxed">
                    {audience.description}
                  </p>
                  
                  {/* Features */}
                  <ul className="space-y-2 mb-4">
                    {audience.features.map((feature, featureIndex) => (
                      <li key={featureIndex} className="flex items-center text-sm text-neutral-600">
                        <svg className="w-4 h-4 text-green-500 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                        {feature}
                      </li>
                    ))}
                  </ul>
                  
                  {/* Hover Hint */}
                  <div className="text-blue-600 font-semibold text-sm opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    Hover for details →
                  </div>
                </div>

                {/* Back Side */}
                <div className="absolute inset-0 w-full h-full [backface-visibility:hidden] [transform:rotateY(180deg)] card-hover bg-gradient-to-br from-gray-50 to-white">
                  {/* Header */}
                  <div className="flex items-center mb-4">
                    <div className={`w-8 h-8 ${audience.bgColor} rounded-lg flex items-center justify-center mr-3`}>
                      <audience.icon className={`w-4 h-4 ${audience.color}`} />
                    </div>
                    <h3 className="text-lg font-semibold text-neutral-900">{audience.title}</h3>
                  </div>
                  
                  {/* Programs */}
                  <div className="mb-4">
                    <h4 className="text-sm font-semibold text-neutral-700 mb-2">Available Programs:</h4>
                    <div className="space-y-2">
                      {audience.details.programs.map((program, programIndex) => (
                        <div key={programIndex} className="bg-white rounded-lg p-3 shadow-sm">
                          <div className="flex justify-between items-start mb-1">
                            <span className="text-sm font-medium text-neutral-900">{program.name}</span>
                            <span className="text-xs font-semibold text-green-600">{program.amount}</span>
                          </div>
                          <p className="text-xs text-neutral-600">{program.description}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  {/* Benefits */}
                  <div className="mb-4">
                    <h4 className="text-sm font-semibold text-neutral-700 mb-2">Key Benefits:</h4>
                    <ul className="space-y-1">
                      {audience.details.benefits.map((benefit, benefitIndex) => (
                        <li key={benefitIndex} className="flex items-center text-xs text-neutral-600">
                          <svg className="w-3 h-3 text-green-500 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                          {benefit}
                        </li>
                      ))}
                    </ul>
                  </div>
                  
                  {/* CTA */}
                  <a 
                    href="/reco" 
                    className={`w-full px-4 py-2 ${audience.bgColor} ${audience.color} rounded-lg font-semibold text-center hover:opacity-80 transition-opacity text-sm`}
                  >
                    {audience.details.cta}
                  </a>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

      </div>
    </section>
  );
}
