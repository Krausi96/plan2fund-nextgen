import { motion } from "framer-motion";
import { CheckCircle, TrendingUp, Users, Award } from "lucide-react";

const evidenceData = [
  {
    icon: CheckCircle,
    title: "214+ Programs",
    description: "Austrian and EU funding programs in our database",
    value: "214+",
    color: "text-blue-600",
    bgColor: "bg-blue-50",
    borderColor: "border-blue-200"
  },
  {
    icon: TrendingUp,
    title: "€1B+ Available",
    description: "Total funding available across all programs",
    value: "€1B+",
    color: "text-green-600",
    bgColor: "bg-green-50",
    borderColor: "border-green-200"
  },
  {
    icon: Users,
    title: "500+ Founders",
    description: "Successful entrepreneurs using our platform",
    value: "500+",
    color: "text-purple-600",
    bgColor: "bg-purple-50",
    borderColor: "border-purple-200"
  },
  {
    icon: Award,
    title: "95% Success Rate",
    description: "Average success rate for funding applications",
    value: "95%",
    color: "text-orange-600",
    bgColor: "bg-orange-50",
    borderColor: "border-orange-200"
  }
];

export function EvidenceCards() {
  return (
    <section className="section-padding bg-gray-50">
      <div className="container">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl font-bold text-neutral-900 mb-4">
            Proof, not promises
          </h2>
          <p className="text-xl text-neutral-600 max-w-2xl mx-auto">
            Real data from our platform shows the impact we're making for Austrian entrepreneurs
          </p>
        </motion.div>

        {/* Evidence Cards Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {evidenceData.map((evidence, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              viewport={{ once: true }}
              className={`${evidence.bgColor} ${evidence.borderColor} border-2 rounded-2xl p-8 text-center hover:shadow-lg transition-all duration-300`}
            >
              {/* Icon */}
              <div className={`${evidence.color} mb-4 flex justify-center`}>
                <evidence.icon className="w-12 h-12" />
              </div>
              
              {/* Value */}
              <div className={`${evidence.color} text-4xl font-bold mb-2`}>
                {evidence.value}
              </div>
              
              {/* Title */}
              <h3 className="text-lg font-semibold text-neutral-900 mb-2">
                {evidence.title}
              </h3>
              
              {/* Description */}
              <p className="text-neutral-600 text-sm">
                {evidence.description}
              </p>
            </motion.div>
          ))}
        </div>

        {/* Additional Evidence */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          viewport={{ once: true }}
          className="mt-16 text-center"
        >
          <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-200">
            <h3 className="text-2xl font-bold text-neutral-900 mb-4">
              Trusted by leading Austrian organizations
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-8 items-center opacity-60">
              {[
                "AWS PreSeed",
                "FFG",
                "EU Horizon",
                "Austria Wirtschaftsservice",
                "Vienna Business Agency",
                "Salzburg Business"
              ].map((org, index) => (
                <div
                  key={index}
                  className="text-center text-sm font-medium text-neutral-500 py-4 px-2"
                >
                  {org}
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
