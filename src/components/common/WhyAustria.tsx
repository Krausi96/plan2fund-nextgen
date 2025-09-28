import { motion } from "framer-motion";
import { Building2, Euro, Users } from "lucide-react";
import { useI18n } from "@/contexts/I18nContext";

export function WhyAustria() {
  const { t } = useI18n();

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
            {t('whyAustria.title')}
          </h2>
          <p className="text-xl text-neutral-600 max-w-2xl mx-auto">
            {t('whyAustria.subtitle')}
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
              {t('whyAustria.benefits.innovation.title')}
            </h3>
            <p className="text-neutral-600">
              {t('whyAustria.benefits.innovation.description')}
            </p>
          </div>

          <div className="text-center p-6">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Euro className="w-8 h-8 text-green-600" />
            </div>
            <h3 className="text-xl font-semibold text-neutral-900 mb-2">
              {t('whyAustria.benefits.funding.title')}
            </h3>
            <p className="text-neutral-600">
              {t('whyAustria.benefits.funding.description')}
            </p>
          </div>

          <div className="text-center p-6">
            <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Users className="w-8 h-8 text-purple-600" />
            </div>
            <h3 className="text-xl font-semibold text-neutral-900 mb-2">
              {t('whyAustria.benefits.support.title')}
            </h3>
            <p className="text-neutral-600">
              {t('whyAustria.benefits.support.description')}
            </p>
          </div>
        </motion.div>

      </div>
    </section>
  );
}
