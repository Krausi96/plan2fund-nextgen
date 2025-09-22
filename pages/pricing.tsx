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

        <section className="max-w-6xl mx-auto py-12 grid md:grid-cols-3 gap-8 px-4">
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

        <CTAStrip
          title={t('cta.readyToStart')}
          subtitle={t('cta.choosePlan')}
          primaryAction={{
            label: t('cta.startPlan'),
            href: "/reco"
          }}
          secondaryAction={{
            label: t('cta.learnMore'),
            href: "/features"
          }}
        />
      </main>
    </>
  );
}
