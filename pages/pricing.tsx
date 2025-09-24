import { CheckCircle } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import HeroLite from "@/components/common/HeroLite";
import CTAStrip from "@/components/common/CTAStrip";
import SEOHead from "@/components/common/SEOHead";
import { useI18n } from "@/contexts/I18nContext";

const plans = [
  { 
    id: "custom",
    title: "📘 Custom Business Plan", 
    price: "€299", 
    desc: "Complete business plan tailored to your funding requirements", 
    features: ["Tailored to selected provider", "Bank-ready financials", "PDF/DOCX export"],
    mode: "custom"
  },
  { 
    id: "upgrade",
    title: "🔍 Upgrade & Review", 
    price: "€149", 
    desc: "Revise and upgrade your existing plan to meet requirements", 
    features: ["Formatting & compliance review", "Expert edits & improvements", "PDF/DOCX export"],
    mode: "upgrade",
    featured: true
  },
  { 
    id: "strategy",
    title: "🧩 Strategy & Modelling Plan", 
    price: "€99", 
    desc: "Business model and strategy for early-stage ideas", 
    features: ["Business model outline", "Unit economics", "Upgrade path available"],
    mode: "strategy"
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
              <div className="bg-gray-50 rounded-lg p-6 space-y-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Best for</h3>
                  <p className="text-gray-700">visas, grants, bank loans</p>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">You get</h3>
                  <ul className="text-gray-700 space-y-1">
                    <li>• Tailored to selected provider</li>
                    <li>• Bank-ready financials</li>
                    <li>• PDF/DOCX export</li>
                  </ul>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Timeline</h3>
                  <p className="text-gray-700">5-7 business days</p>
                </div>
              </div>
            </div>

            {/* Upgrade & Review Details */}
            <div id="upgrade" className="scroll-mt-20">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">🔍 Upgrade & Review</h2>
              <div className="bg-gray-50 rounded-lg p-6 space-y-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Best for</h3>
                  <p className="text-gray-700">you already have a draft</p>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">You get</h3>
                  <ul className="text-gray-700 space-y-1">
                    <li>• Formatting & compliance review</li>
                    <li>• Expert edits & improvements</li>
                    <li>• PDF/DOCX export</li>
                  </ul>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Timeline</h3>
                  <p className="text-gray-700">3-5 business days</p>
                </div>
              </div>
            </div>

            {/* Strategy & Modelling Plan Details */}
            <div id="strategy" className="scroll-mt-20">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">🧩 Strategy & Modelling Plan (4–8 pages)</h2>
              <div className="bg-gray-50 rounded-lg p-6 space-y-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Best for</h3>
                  <p className="text-gray-700">early-stage ideas, pivots</p>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">You get</h3>
                  <ul className="text-gray-700 space-y-1">
                    <li>• Business model outline</li>
                    <li>• Unit economics</li>
                    <li>• Upgrade path available</li>
                  </ul>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Timeline</h3>
                  <p className="text-gray-700">2-3 business days</p>
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
