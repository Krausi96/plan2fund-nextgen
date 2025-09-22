import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import SEOHead from "@/components/common/SEOHead";
import { ChevronDown, ChevronUp, HelpCircle } from "lucide-react";
import analytics from "@/lib/analytics";

interface FAQItem {
  id: string;
  question: string;
  answer: string;
  category: string;
}

const faqData: FAQItem[] = [
  {
    id: "how-it-works",
    question: "How does the funding recommendation work?",
    answer: "Our AI analyzes your business details and matches you with relevant funding programs based on eligibility criteria, funding amounts, and program requirements. We consider factors like your business stage, industry, location, and funding needs to provide personalized recommendations.",
    category: "General"
  },
  {
    id: "data-security",
    question: "Is my business plan data secure?",
    answer: "Yes, we use enterprise-grade security measures and are GDPR compliant. Your data is encrypted both in transit and at rest, and we never share your information without your explicit consent. You can also delete your data at any time through your account settings.",
    category: "Security"
  },
  {
    id: "time-to-complete",
    question: "How long does it take to create a business plan?",
    answer: "Most users complete their business plan in 2-4 hours using our guided process and templates. Our program-aware editor pre-fills relevant sections based on your selected funding program, making it much faster than starting from scratch.",
    category: "General"
  },
  {
    id: "refunds",
    question: "Do you offer refunds?",
    answer: "Yes, we offer a 30-day money-back guarantee if you're not satisfied with our service. Contact our support team to request a refund, and we'll process it within 5 business days.",
    category: "Billing"
  },
  {
    id: "funding-programs",
    question: "What funding programs are supported?",
    answer: "We support over 214 Austrian and EU funding programs including AWS PreSeed, FFG, EU startup calls, bank loans, and more. Our database is regularly updated with new programs and eligibility criteria.",
    category: "Programs"
  },
  {
    id: "pricing",
    question: "Is Plan2Fund free to use?",
    answer: "Yes, we offer a free tier with basic features including access to our funding database and basic business plan templates. Premium plans are available for advanced functionality, priority support, and additional features.",
    category: "Billing"
  },
  {
    id: "export-formats",
    question: "What formats can I export my business plan in?",
    answer: "You can export your business plan in PDF, Word, and PowerPoint formats. Premium users also get access to additional export options and custom branding.",
    category: "Features"
  },
  {
    id: "collaboration",
    question: "Can I collaborate with team members on my business plan?",
    answer: "Yes, our premium plans include team collaboration features. You can invite team members, assign sections, track changes, and work together in real-time on your business plan.",
    category: "Features"
  },
  {
    id: "support",
    question: "What kind of support do you offer?",
    answer: "We offer email support for all users and priority support for premium users. We also have a comprehensive knowledge base, video tutorials, and regular webinars to help you get the most out of Plan2Fund.",
    category: "Support"
  },
  {
    id: "updates",
    question: "How often is the funding database updated?",
    answer: "Our funding database is updated monthly with new programs, changes to existing programs, and updated eligibility criteria. We also monitor program deadlines and notify users of upcoming opportunities.",
    category: "Programs"
  },
  {
    id: "compliance",
    question: "Does Plan2Fund ensure compliance with funding program requirements?",
    answer: "While we help structure your business plan according to program requirements, final compliance is your responsibility. We recommend reviewing program guidelines and consulting with funding advisors for complex applications.",
    category: "Compliance"
  },
  {
    id: "success-rate",
    question: "What's the success rate of users who use Plan2Fund?",
    answer: "Users who complete our guided process and follow our recommendations have a significantly higher success rate in securing funding. While we can't guarantee approval, our structured approach and program-specific guidance greatly improve your chances.",
    category: "General"
  }
];

const categories = ["All", "General", "Security", "Billing", "Programs", "Features", "Support", "Compliance"];

export default function FAQPage() {
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [openItems, setOpenItems] = useState<string[]>([]);

  useEffect(() => {
    analytics.trackPageView('/faq', 'FAQ');
    analytics.trackUserAction('faq_page_viewed');
  }, []);

  const filteredFAQs = selectedCategory === "All" 
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
        title="Frequently Asked Questions - Plan2Fund"
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
              <h1 className="text-4xl font-bold text-gray-900">Frequently Asked Questions</h1>
            </div>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Find answers to common questions about our business planning platform and funding recommendations.
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
                Still have questions?
              </h3>
              <p className="text-gray-600 mb-6">
                Can't find what you're looking for? Our support team is here to help.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <a
                  href="/contact"
                  className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                >
                  Contact Support
                </a>
                <a
                  href="/about"
                  className="px-6 py-3 border border-blue-600 text-blue-600 rounded-lg hover:bg-blue-50 transition-colors font-medium"
                >
                  Learn More
                </a>
              </div>
            </Card>
          </div>
        </div>
      </main>
    </>
  );
}
