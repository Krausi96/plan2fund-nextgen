import { motion } from "framer-motion";
import { Building2, Euro, Users } from "lucide-react";

export function WhyAustria() {
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
            Why Austria? 🇦🇹
          </h2>
          <p className="text-xl text-neutral-600 max-w-2xl mx-auto">
            Austria offers one of Europe's most comprehensive funding ecosystems for startups and SMEs, with strong innovation culture, generous funding programs, and a supportive business environment.
          </p>
        </motion.div>


        {/* Benefits */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          viewport={{ once: true }}
          className="grid md:grid-cols-3 gap-8"
        >
          <div className="text-center p-6">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Building2 className="w-8 h-8 text-blue-600" />
            </div>
            <h3 className="text-xl font-semibold text-neutral-900 mb-2">
              Strong Innovation Ecosystem
            </h3>
            <p className="text-neutral-600">
              Austria ranks among Europe's top innovation hubs with world-class research institutions and supportive government policies.
            </p>
          </div>

          <div className="text-center p-6">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Euro className="w-8 h-8 text-green-600" />
            </div>
            <h3 className="text-xl font-semibold text-neutral-900 mb-2">
              Generous Funding Programs
            </h3>
            <p className="text-neutral-600">
              From AWS PreSeed to EU Horizon programs, Austrian companies have access to over €1B in funding opportunities.
            </p>
          </div>

          <div className="text-center p-6">
            <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Users className="w-8 h-8 text-purple-600" />
            </div>
            <h3 className="text-xl font-semibold text-neutral-900 mb-2">
              Supportive Business Environment
            </h3>
            <p className="text-neutral-600">
              Low bureaucracy, excellent infrastructure, and a highly skilled workforce make Austria ideal for business growth.
            </p>
          </div>
        </motion.div>

      </div>
    </section>
  );
}
