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
    category: t("faq.categories.general")
  },
  {
    id: "pricing",
    question: t("faq.questions.pricing.question"),
    answer: t("faq.questions.pricing.answer"),
    category: t("faq.categories.general")
  },
  {
    id: "refunds",
    question: t("faq.questions.refunds.question"),
    answer: t("faq.questions.refunds.answer"),
    category: t("faq.categories.general")
  },
  {
    id: "funding-programs",
    question: t("faq.questions.fundingPrograms.question"),
    answer: t("faq.questions.fundingPrograms.answer"),
    category: t("faq.categories.general")
  },
  {
    id: "export-formats",
    question: t("faq.questions.exportFormats.question"),
    answer: t("faq.questions.exportFormats.answer"),
    category: t("faq.categories.general")
  },
  {
    id: "support",
    question: t("faq.questions.support.question"),
    answer: t("faq.questions.support.answer"),
    category: t("faq.categories.general")
  },
  {
    id: "time-to-complete",
    question: t("faq.questions.timeToComplete.question"),
    answer: t("faq.questions.timeToComplete.answer"),
    category: t("faq.categories.general")
  }
];

const getCategories = (t: (key: any) => string) => [
  t("faq.categories.all"),
  t("faq.categories.general")
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
      
      <main className="min-h-screen bg-gradient-to-b from-gray-50 via-white to-gray-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          {/* Header */}
          <div className="text-center mb-12">
            <div className="flex items-center justify-center mb-4">
              <div className="bg-gradient-to-br from-blue-100 to-blue-50 p-3 rounded-xl mr-3 shadow-md">
                <HelpCircle className="w-10 h-10 text-blue-600" />
              </div>
              <h1 className="text-3xl md:text-4xl font-bold text-neutral-900 tracking-tight">{t("faq.title")}</h1>
            </div>
            <p className="text-lg md:text-xl text-neutral-600 max-w-2xl mx-auto">
              {t("faq.subtitle")}
            </p>
          </div>

          {/* Category Filter */}
          <div className="mb-12">
            <div className="flex flex-wrap gap-3 justify-center">
              {categories.map((category) => (
                <button
                  key={category}
                  onClick={() => handleCategoryChange(category)}
                  className={`px-6 py-3 rounded-xl text-sm font-semibold transition-all duration-300 ${
                    selectedCategory === category
                      ? "bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-lg"
                      : "bg-white text-neutral-700 hover:bg-blue-50/50 border-2 border-neutral-200 hover:border-blue-300 shadow-sm"
                  }`}
                >
                  {category}
                </button>
              ))}
            </div>
          </div>

          {/* FAQ Items */}
          <div className="space-y-4 mb-16">
            {filteredFAQs.map((faq) => (
              <Card key={faq.id} className="overflow-hidden rounded-2xl border-2 border-neutral-200 shadow-sm hover:shadow-md hover:border-blue-200 transition-all duration-300 bg-white">
                <button
                  onClick={() => toggleItem(faq.id)}
                  className="w-full p-6 md:p-8 text-left flex items-center justify-between hover:bg-blue-50/30 transition-colors group"
                >
                  <h3 className="text-lg md:text-xl font-bold text-neutral-900 pr-4 group-hover:text-blue-600 transition-colors">
                    {faq.question}
                  </h3>
                  {openItems.includes(faq.id) ? (
                    <ChevronUp className="w-6 h-6 text-blue-600 flex-shrink-0" />
                  ) : (
                    <ChevronDown className="w-6 h-6 text-neutral-500 group-hover:text-blue-600 flex-shrink-0 transition-colors" />
                  )}
                </button>
                {openItems.includes(faq.id) && (
                  <div className="px-6 md:px-8 pb-6 md:pb-8">
                    <div className="border-t border-neutral-200 pt-6">
                      <p className="text-neutral-700 leading-relaxed text-base">{faq.answer}</p>
                    </div>
                  </div>
                )}
              </Card>
            ))}
          </div>

          {/* Contact CTA */}
          <div className="text-center">
            <Card className="p-8 bg-gradient-to-br from-blue-50 via-white to-blue-50/50 border-2 border-blue-200 rounded-2xl shadow-lg">
              <h3 className="text-xl md:text-2xl font-bold text-neutral-900 mb-3">
                {t("faq.cta.title")}
              </h3>
              <p className="text-neutral-700 mb-6 text-base">
                {t("faq.cta.subtitle")}
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <a
                  href="/contact"
                  className="px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all font-semibold shadow-md hover:shadow-lg text-sm"
                >
                  {t("faq.cta.contactSupport")}
                </a>
                <a
                  href="/marketing/about"
                  className="px-6 py-3 border-2 border-blue-600 text-blue-600 rounded-xl hover:bg-blue-50 transition-all font-semibold text-sm"
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
