import { useState, useEffect } from "react";
import { Card } from "@/shared/components/ui/card";
import SEOHead from '@/shared/components/common/SEOHead';
import { ChevronDown, ChevronUp, HelpCircle } from "lucide-react";
import analytics from "@/shared/user/analytics";
import { useI18n } from "@/shared/contexts/I18nContext";

interface FAQItem {
  id: string;
  question: string;
  answer: string;
  category: string;
}

const getFAQData = (t: (key: any) => string): FAQItem[] => [
  {
    id: "how-it-works",
    question: t("faq.questions.howItWorks.question"),
    answer: t("faq.questions.howItWorks.answer"),
    category: t("faq.categories.general")
  },
  {
    id: "data-security",
    question: t("faq.questions.dataSecurity.question"),
    answer: t("faq.questions.dataSecurity.answer"),
    category: t("faq.categories.security")
  },
  {
    id: "time-to-complete",
    question: t("faq.questions.timeToComplete.question"),
    answer: t("faq.questions.timeToComplete.answer"),
    category: t("faq.categories.general")
  },
  {
    id: "refunds",
    question: t("faq.questions.refunds.question"),
    answer: t("faq.questions.refunds.answer"),
    category: t("faq.categories.billing")
  },
  {
    id: "funding-programs",
    question: t("faq.questions.fundingPrograms.question"),
    answer: t("faq.questions.fundingPrograms.answer"),
    category: t("faq.categories.programs")
  },
  {
    id: "pricing",
    question: t("faq.questions.pricing.question"),
    answer: t("faq.questions.pricing.answer"),
    category: t("faq.categories.billing")
  },
  {
    id: "export-formats",
    question: t("faq.questions.exportFormats.question"),
    answer: t("faq.questions.exportFormats.answer"),
    category: t("faq.categories.features")
  },
  {
    id: "collaboration",
    question: t("faq.questions.collaboration.question"),
    answer: t("faq.questions.collaboration.answer"),
    category: t("faq.categories.features")
  },
  {
    id: "support",
    question: t("faq.questions.support.question"),
    answer: t("faq.questions.support.answer"),
    category: t("faq.categories.support")
  },
  {
    id: "updates",
    question: t("faq.questions.updates.question"),
    answer: t("faq.questions.updates.answer"),
    category: t("faq.categories.programs")
  },
  {
    id: "compliance",
    question: t("faq.questions.compliance.question"),
    answer: t("faq.questions.compliance.answer"),
    category: t("faq.categories.compliance")
  },
  {
    id: "success-rate",
    question: t("faq.questions.successRate.question"),
    answer: t("faq.questions.successRate.answer"),
    category: t("faq.categories.general")
  }
];

const getCategories = (t: (key: any) => string) => [
  t("faq.categories.all"),
  t("faq.categories.general"),
  t("faq.categories.security"),
  t("faq.categories.billing"),
  t("faq.categories.programs"),
  t("faq.categories.features"),
  t("faq.categories.support"),
  t("faq.categories.compliance")
];

export default function FAQPage() {
  const { t } = useI18n();
  const [selectedCategory, setSelectedCategory] = useState(t("faq.categories.all"));
  const [openItems, setOpenItems] = useState<string[]>([]);

  const faqData = getFAQData(t);
  const categories = getCategories(t);

  useEffect(() => {
    analytics.trackPageView('/faq', 'FAQ');
    analytics.trackUserAction('faq_page_viewed');
  }, []);

  const filteredFAQs = selectedCategory === t("faq.categories.all")
    ? faqData 
    : faqData.filter(faq => faq.category === selectedCategory);

  const toggleItem = (id: string) => {
    setOpenItems(prev => {
      const isOpening = !prev.includes(id);
      analytics.trackUserAction('faq_item_toggled', {
        item_id: id,
        action: isOpening ? 'opened' : 'closed',
        category: selectedCategory
      });
      
      return isOpening 
        ? [...prev, id]
        : prev.filter(item => item !== id);
    });
  };

  const handleCategoryChange = (category: string) => {
    setSelectedCategory(category);
    analytics.trackUserAction('faq_category_changed', { category });
  };

  return (
    <>
      <SEOHead 
        pageKey="faq"
        title={t('faq.ogTitle')}
        description="Find answers to common questions about Plan2Fund's business planning and funding recommendation platform."
        schema="faq"
      />
      
      <main className="min-h-screen bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 py-12">
          {/* Header */}
          <div className="text-center mb-12">
            <div className="flex items-center justify-center mb-6">
              <div className="bg-blue-100 p-3 rounded-full mr-4">
                <HelpCircle className="w-12 h-12 text-blue-600" />
              </div>
              <h1 className="text-4xl font-bold text-gray-900">{t("faq.title")}</h1>
            </div>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              {t("faq.subtitle")}
            </p>
          </div>

          {/* Category Filter */}
          <div className="mb-8">
            <div className="flex flex-wrap gap-2 justify-center">
              {categories.map((category) => (
                <button
                  key={category}
                  onClick={() => handleCategoryChange(category)}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                    selectedCategory === category
                      ? "bg-blue-600 text-white"
                      : "bg-white text-gray-700 hover:bg-gray-100 border border-gray-300"
                  }`}
                >
                  {category}
                </button>
              ))}
            </div>
          </div>

          {/* FAQ Items */}
          <div className="space-y-4">
            {filteredFAQs.map((faq) => (
              <Card key={faq.id} className="overflow-hidden">
                <button
                  onClick={() => toggleItem(faq.id)}
                  className="w-full p-6 text-left flex items-center justify-between hover:bg-gray-50 transition-colors"
                >
                  <h3 className="text-lg font-semibold text-gray-900 pr-4">
                    {faq.question}
                  </h3>
                  {openItems.includes(faq.id) ? (
                    <ChevronUp className="w-5 h-5 text-gray-500 flex-shrink-0" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-gray-500 flex-shrink-0" />
                  )}
                </button>
                {openItems.includes(faq.id) && (
                  <div className="px-6 pb-6">
                    <div className="border-t pt-4">
                      <p className="text-gray-700 leading-relaxed">{faq.answer}</p>
                    </div>
                  </div>
                )}
              </Card>
            ))}
          </div>

          {/* Contact CTA */}
          <div className="mt-12 text-center">
            <Card className="p-8 bg-blue-50 border-blue-200">
              <h3 className="text-xl font-semibold text-gray-900 mb-4">
                {t("faq.cta.title")}
              </h3>
              <p className="text-gray-600 mb-6">
                {t("faq.cta.subtitle")}
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <a
                  href="/contact"
                  className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                >
                  {t("faq.cta.contactSupport")}
                </a>
                <a
                  href="/about"
                  className="px-6 py-3 border border-blue-600 text-blue-600 rounded-lg hover:bg-blue-50 transition-colors font-medium"
                >
                  {t("faq.cta.learnMore")}
                </a>
              </div>
            </Card>
          </div>
        </div>
      </main>
    </>
  );
}
