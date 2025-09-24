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
    desc: "Your model is defined. We turn it into a **submission-ready plan** reviewers can read quickly.", 
    features: ["Complete plan in the order reviewers expect (Exec Summary → Financials)", "Financial tables: revenue, costs, cash flow, use of funds", "Checklist matched to aws/FFG/Wirtschaftsagentur or bank requirements", "DE/EN · PDF/DOCX export"],
    mode: "custom",
    badges: ["DE/EN", "PDF/DOCX", "Checklist included"]
  },
  { 
    id: "upgrade",
    title: "🔍 Upgrade & Review", 
    price: "€149", 
    desc: "Have a plan or partial draft? We **fix structure, fill gaps, and polish** it to the required outline.", 
    features: ["Gap report vs. target outline (aws/FFG/WA/bank/visa)", "Rewrite + reformat; add missing sections/financials", "Track changes so you approve every edit", "DE/EN · PDF/DOCX export"],
    mode: "upgrade",
    featured: true,
    badges: ["DE/EN", "PDF/DOCX", "Gap report"]
  },
  { 
    id: "strategy",
    title: "🧩 Strategy & Modelling Plan", 
    price: "€99", 
    desc: "Idea not fully defined? We turn it into a **clear business model & go-to-market**.", 
    features: ["Value prop, customer profile, pricing & positioning", "Unit economics + milestones / next steps", "Upgrade path to full Business Plan", "DE/EN deliverable"],
    mode: "strategy",
    badges: ["DE/EN", "Short plan", "Upgrade path"]
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
              <p className="text-gray-600 mt-2" dangerouslySetInnerHTML={{ __html: plan.desc }}></p>
              <p className="text-lg font-semibold mt-4">{plan.price}</p>
              <ul className="mt-6 space-y-2">
                {plan.features.map((f, j) => (
                  <li key={j} className="flex items-center space-x-2 text-gray-600">
                    <CheckCircle className="h-5 w-5 text-blue-500" />
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
              {/* Badges */}
              <div className="flex flex-wrap gap-2 mt-4">
                {plan.badges.map((badge, badgeIndex) => (
                  <span key={badgeIndex} className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">
                    {badge}
                  </span>
                ))}
              </div>
              
              {/* Action Buttons */}
              <div className="mt-6 space-y-3">
                <Link href={`/confirm?plan=${plan.id}&mode=${plan.mode}`} className="block">
                  <Button className="w-full">
                    {plan.mode === 'upgrade' ? 'Upload & Review' : `Choose ${plan.title.split(' ')[0]}`}
                  </Button>
                </Link>
                <a 
                  href={`#${plan.id}`} 
                  className="block text-center text-sm text-blue-600 hover:text-blue-800 transition-colors"
                >
                  View details ↓
                </a>
              </div>
            </div>
          ))}
        </section>

        {/* Detailed Plan Sections */}
        <section className="max-w-4xl mx-auto py-16 px-4">
          <div className="text-center mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Detailed Information</h2>
            <p className="text-gray-600">Learn more about each plan option below</p>
          </div>
          <div className="space-y-16">
            
            {/* Custom Business Plan Details */}
            <div id="custom" className="scroll-mt-20">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">📘 Custom Business Plan <span className="text-sm bg-gray-100 text-gray-600 px-2 py-1 rounded">15–35 pages</span></h2>
              
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Ideal when:</h3>
                  <ul className="text-gray-700 space-y-1">
                    <li>• Your model is defined (offer, market, target group, pricing, channels).</li>
                    <li>• You need a plan for a visa/grant/bank submission (DE or EN).</li>
                    <li>• You want a coherent document reviewers can scan quickly.</li>
                  </ul>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">You provide:</h3>
                  <ul className="text-gray-700 space-y-1">
                    <li>• Your model summary and goals.</li>
                    <li>• Basic numbers (price, volumes, costs, investment need).</li>
                    <li>• Target program/bank/visa (if known).</li>
                  </ul>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">What you get (deliverables):</h3>
                  <ul className="text-gray-700 space-y-1">
                    <li>• A 15–35 page plan in the order reviewers expect (Executive Summary, Problem/Solution, Market & Competition, Product/Operations, Team, Go-to-Market, Financials, Risks).</li>
                    <li>• Financial tables: revenue model, cost breakdown, cash-flow template, use of funds.</li>
                    <li>• Checklist matched to aws/FFG/Wirtschaftsagentur or bank requirements.</li>
                    <li>• Clear wording; we edit, you approve.</li>
                    <li>• Export: <strong>PDF/DOCX</strong> in <strong>DE/EN</strong>.</li>
                  </ul>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Advantages:</h3>
                  <ul className="text-gray-700 space-y-1">
                    <li>• Cuts back-and-forth by matching familiar structure.</li>
                    <li>• Faster first draft than starting from scratch.</li>
                    <li>• Bilingual output when needed.</li>
                  </ul>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Format & output:</h3>
                  <p className="text-gray-700">DE/EN · 15–35 pages · PDF/DOCX.</p>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Not included:</h3>
                  <p className="text-gray-700">Legal/immigration advice; audited statements; <strong>no approval guarantee</strong>.</p>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Upgrade path:</h3>
                  <p className="text-gray-700">Later edits via <strong>Upgrade & Review</strong>. If the model is unclear, start with <strong>Strategy & Modelling</strong>.</p>
                </div>
              </div>
            </div>

            {/* Upgrade & Review Details */}
            <div id="upgrade" className="scroll-mt-20">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">🔍 Upgrade & Review <span className="text-sm bg-gray-100 text-gray-600 px-2 py-1 rounded">bring your draft</span></h2>
              
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Ideal when:</h3>
                  <ul className="text-gray-700 space-y-1">
                    <li>• You already have a plan/draft/sections.</li>
                    <li>• The outline or formatting doesn't match aws/FFG/WA/bank/visa expectations.</li>
                    <li>• You're missing sections or financials.</li>
                  </ul>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">You provide:</h3>
                  <ul className="text-gray-700 space-y-1">
                    <li>• Your current document(s) and target program/bank template (if any).</li>
                    <li>• Latest numbers and any reviewer feedback.</li>
                  </ul>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">What you get (deliverables):</h3>
                  <ul className="text-gray-700 space-y-1">
                    <li>• Gap report vs. the required outline.</li>
                    <li>• Rewrite + restructure; formatting to the expected style.</li>
                    <li>• Missing sections/financials added.</li>
                    <li>• Tracked changes so you keep control.</li>
                    <li>• Export: <strong>PDF/DOCX</strong> in <strong>DE/EN</strong>.</li>
                  </ul>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Advantages:</h3>
                  <ul className="text-gray-700 space-y-1">
                    <li>• Keeps your voice; fixes only what's needed.</li>
                    <li>• Aligns to reviewer expectations without a full rewrite.</li>
                    <li>• Quicker turnaround than writing new.</li>
                  </ul>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Format & output:</h3>
                  <p className="text-gray-700">DE/EN · Revised submission-ready plan · PDF/DOCX.</p>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Not included:</h3>
                  <p className="text-gray-700">Legal/visa advice; approval guarantees; audited financials.</p>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Upgrade path:</h3>
                  <p className="text-gray-700">If foundations are weak, pair with <strong>Strategy & Modelling</strong>.</p>
                </div>
              </div>
            </div>

            {/* Strategy & Modelling Plan Details */}
            <div id="strategy" className="scroll-mt-20">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">🧩 Strategy & Modelling Plan <span className="text-sm bg-gray-100 text-gray-600 px-2 py-1 rounded">4–8 pages</span></h2>
              
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Ideal when:</h3>
                  <ul className="text-gray-700 space-y-1">
                    <li>• Idea is early or pivoting; target group/pricing/positioning are not final.</li>
                    <li>• You need a concise brief to align co-founders or advisors.</li>
                  </ul>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">You provide:</h3>
                  <ul className="text-gray-700 space-y-1">
                    <li>• Idea description, goals, constraints; any notes on market/competitors.</li>
                  </ul>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">What you get (deliverables):</h3>
                  <ul className="text-gray-700 space-y-1">
                    <li>• Strategy brief: value proposition, ideal customer, pricing & positioning, channels, MVP scope.</li>
                    <li>• Unit economics sketch (how you make money).</li>
                    <li>• Milestones & next steps; risk & assumptions log.</li>
                    <li>• Export: <strong>PDF/DOCX</strong> in <strong>DE/EN</strong>.</li>
                  </ul>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Advantages:</h3>
                  <ul className="text-gray-700 space-y-1">
                    <li>• Turns a fuzzy idea into a concrete model.</li>
                    <li>• Creates a base you can upgrade to a full plan.</li>
                  </ul>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Format & output:</h3>
                  <p className="text-gray-700">DE/EN · 4–8 pages · PDF/DOCX.</p>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Not included:</h3>
                  <p className="text-gray-700">Market due-diligence reports; legal/visa advice; any approval guarantee.</p>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Upgrade path:</h3>
                  <p className="text-gray-700">Move to <strong>Custom Business Plan</strong> when the model is set.</p>
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

        {/* Disclaimer Footer */}
        <div className="bg-gray-50 py-8">
          <div className="max-w-4xl mx-auto px-4 text-center">
            <p className="text-sm text-gray-600">
              We help you prepare your application; decisions are made by the providers.
            </p>
          </div>
        </div>
      </main>
    </>
  );
}
