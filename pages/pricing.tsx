import { CheckCircle } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import HeroLite from "@/components/common/HeroLite";
import CTAStrip from "@/components/common/CTAStrip";
import SEOHead from "@/components/common/SEOHead";
import { useI18n } from "@/contexts/I18nContext";

const plans = [
  { 
    id: "strategy",
    title: "Strategy (4-8 pages)", 
    price: "€99", 
    desc: "Concise business strategy template for quick planning.", 
    features: ["Summary, Problem, ICP", "Strategy, GTM outline", "Next 90 days"],
    mode: "strategy"
  },
  { 
    id: "upgrade",
    title: "Upgrade & Review", 
    price: "€149", 
    desc: "Upload existing plan for professional review and enhancement.", 
    features: ["Formatting & Structure", "Financials review", "Funding fit analysis"],
    mode: "upgrade",
    featured: true
  },
  { 
    id: "custom",
    title: "Custom (15-35 pages)", 
    price: "€299", 
    desc: "Full business plan with all chapters and subchapters.", 
    features: ["Complete template", "Subchapters & checklists", "Professor tips"],
    mode: "custom"
  },
];

export default function Pricing() {
  const { t } = useI18n();

  return (
    <>
      <SEOHead pageKey="pricing" schema="faq" />
      
      <main className="bg-white">
        <HeroLite
          title={t('pricing.title')}
          subtitle={t('pricing.subtitle')}
        />

        <section id="plans" className="max-w-6xl mx-auto py-12 grid md:grid-cols-3 gap-8 px-4">
          <h1 className="sr-only">{t('pricing.title')}</h1>
          {plans.map((plan, i) => (
            <div key={i} className={`rounded-2xl border shadow-sm p-6 bg-white hover:shadow-md transition ${
              plan.featured ? 'border-blue-200 bg-blue-50' : ''
            }`}>
              <h2 className="text-xl font-bold">{plan.title}</h2>
              <p className="text-gray-600 mt-2">{plan.desc}</p>
              <p className="text-lg font-semibold mt-4">{plan.price}</p>
              <ul className="mt-6 space-y-2">
                {plan.features.map((f, j) => (
                  <li key={j} className="flex items-center space-x-2 text-gray-600">
                    <CheckCircle className="h-5 w-5 text-blue-500" />
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
              <Link href={`/confirm?plan=${plan.id}&mode=${plan.mode}`} className="block mt-6">
                <Button className="w-full">
                  {plan.mode === 'upgrade' ? 'Upload & Review' : `Choose ${plan.title.split(' ')[0]}`}
                </Button>
              </Link>
            </div>
          ))}
        </section>

        {/* Detailed Plan Sections */}
        <section className="max-w-4xl mx-auto py-16 px-4">
          <div className="space-y-16">
            
            {/* Custom Business Plan Details */}
            <div id="custom" className="scroll-mt-20">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">📘 Custom Business Plan (15–35 pages)</h2>
              <div className="bg-gray-50 rounded-lg p-6 space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Ideal when</h3>
                  <p className="text-gray-700">You've defined your model—vision, offer, market, target group, marketing, financials. You need a submission-ready plan aligned with institutional & funding requirements.</p>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Inputs you bring</h3>
                  <ul className="text-gray-700 space-y-1">
                    <li>• Business concept and value proposition</li>
                    <li>• Target market and customer segments</li>
                    <li>• Basic financial projections</li>
                    <li>• Marketing and operational strategy</li>
                  </ul>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">What we deliver</h3>
                  <ul className="text-gray-700 space-y-1">
                    <li>• Narrative tailored to selected provider (aws/FFG/WA/bank/visa)</li>
                    <li>• Structured financials template (bank/grant-ready)</li>
                    <li>• Eligibility alignment + application checklist</li>
                    <li>• DE/EN · PDF/DOCX export</li>
                  </ul>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">What's not included</h3>
                  <ul className="text-gray-700 space-y-1">
                    <li>• Market research and validation</li>
                    <li>• Financial modeling beyond basic projections</li>
                    <li>• Legal and regulatory compliance review</li>
                  </ul>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Typical timeline</h3>
                  <p className="text-gray-700">5-7 business days from input to final delivery</p>
                </div>
              </div>
            </div>

            {/* Upgrade & Review Details */}
            <div id="upgrade" className="scroll-mt-20">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">🔍 Upgrade & Review</h2>
              <div className="bg-gray-50 rounded-lg p-6 space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Ideal when</h3>
                  <p className="text-gray-700">You already have a plan or draft that needs professional review and enhancement for specific funding programs or institutional requirements.</p>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Inputs you bring</h3>
                  <ul className="text-gray-700 space-y-1">
                    <li>• Existing business plan or draft document</li>
                    <li>• Target funding program or institution</li>
                    <li>• Specific areas of concern or improvement</li>
                  </ul>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">What we deliver</h3>
                  <ul className="text-gray-700 space-y-1">
                    <li>• Gap analysis vs. chosen program/bank requirements</li>
                    <li>• Rewriting + formatting to required structure</li>
                    <li>• Missing sections/financials added</li>
                    <li>• DE/EN · PDF/DOCX export</li>
                  </ul>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">What's not included</h3>
                  <ul className="text-gray-700 space-y-1">
                    <li>• Complete business model redesign</li>
                    <li>• Market research and validation</li>
                    <li>• Legal and regulatory compliance review</li>
                  </ul>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Typical timeline</h3>
                  <p className="text-gray-700">3-5 business days from document upload to final delivery</p>
                </div>
              </div>
            </div>

            {/* Strategy & Modelling Plan Details */}
            <div id="strategy" className="scroll-mt-20">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">🧩 Strategy & Modelling Plan (4–8 pages)</h2>
              <div className="bg-gray-50 rounded-lg p-6 space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Ideal when</h3>
                  <p className="text-gray-700">You've got an idea but key details (target group, pricing, positioning) aren't set. You need to shape your business model & strategy before moving into development or a full plan.</p>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Inputs you bring</h3>
                  <ul className="text-gray-700 space-y-1">
                    <li>• Business idea or concept</li>
                    <li>• Basic understanding of the problem you're solving</li>
                    <li>• Initial thoughts on target market</li>
                  </ul>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">What we deliver</h3>
                  <ul className="text-gray-700 space-y-1">
                    <li>• Business model & GTM outline (DE/EN)</li>
                    <li>• Unit economics + next steps & milestones</li>
                    <li>• Upgrade path to Custom Business Plan or Upgrade & Review</li>
                  </ul>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">What's not included</h3>
                  <ul className="text-gray-700 space-y-1">
                    <li>• Detailed financial projections</li>
                    <li>• Complete business plan document</li>
                    <li>• Market research and validation</li>
                  </ul>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Typical timeline</h3>
                  <p className="text-gray-700">2-3 business days from concept to strategy outline</p>
                </div>
              </div>
            </div>

          </div>
        </section>

        <CTAStrip
          title={t('cta.readyToStart')}
          subtitle={t('cta.choosePlan')}
          primaryAction={{
            label: t('cta.startPlan'),
            href: "/reco"
          }}
          secondaryAction={{
            label: t('cta.learnMore'),
            href: "/about"
          }}
        />
      </main>
    </>
  );
}
