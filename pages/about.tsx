import { Card } from "@/components/ui/card";
import HeroLite from "@/components/common/HeroLite";
import CTAStrip from "@/components/common/CTAStrip";
import SEOHead from "@/components/common/SEOHead";
import { useI18n } from "@/contexts/I18nContext";
import { Target, Lightbulb, FileText, Search, BookOpen, Shield, Lock, Mail, ArrowRight } from "lucide-react";
import Link from "next/link";

export default function AboutPage() {
  const { t } = useI18n();

  return (
    <>
      <SEOHead pageKey="about" />
      
      <main>
        <HeroLite
          title={t('about.title')}
          subtitle={t('about.subtitle')}
        />
        
        <div className="max-w-4xl mx-auto px-4 py-12">
          <h1 className="sr-only">{t('about.title')}</h1>

          {/* Mission & Vision */}
          <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-8 mb-16">
            <Card className="p-8">
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mr-4">
                  <Target className="w-6 h-6 text-blue-600" />
                </div>
                <h2 className="text-2xl font-semibold">{t('about.mission.title')}</h2>
              </div>
              <p className="text-gray-600 text-justify leading-relaxed">
                {t('about.mission.description')}
              </p>
            </Card>

            <Card className="p-8">
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center mr-4">
                  <Lightbulb className="w-6 h-6 text-yellow-600" />
                </div>
                <h2 className="text-2xl font-semibold">{t('about.vision.title')}</h2>
              </div>
              <p className="text-gray-600 text-justify leading-relaxed">
                {t('about.vision.description')}
              </p>
            </Card>
          </div>

          {/* How Plan2Fund Helps You */}
          <div className="mb-16">
            <h2 className="text-3xl font-bold text-center mb-12">{t('about.features.title')}</h2>
            <div className="max-w-7xl mx-auto grid md:grid-cols-3 gap-8">
              <Card className="p-8 hover:shadow-lg transition-shadow">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Search className="w-8 h-8 text-blue-600" />
                </div>
                <h3 className="text-xl font-semibold mb-4 text-center">{t('about.features.smartMatching.title')}</h3>
                <div className="text-gray-600 text-justify leading-relaxed space-y-3">
                  <p>
                    {t('about.features.smartMatching.description')}
                  </p>
                </div>
              </Card>

              <Card className="p-8 hover:shadow-lg transition-shadow">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <FileText className="w-8 h-8 text-green-600" />
                </div>
                <h3 className="text-xl font-semibold mb-4 text-center">{t('about.features.professionalPlans.title')}</h3>
                <div className="text-gray-600 text-justify leading-relaxed space-y-3">
                  <p>
                    {t('about.features.professionalPlans.description')}
                  </p>
                </div>
              </Card>

              <Card className="p-8 hover:shadow-lg transition-shadow">
                <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <BookOpen className="w-8 h-8 text-purple-600" />
                </div>
                <h3 className="text-xl font-semibold mb-4 text-center">{t('about.features.expertGuidance.title')}</h3>
                <div className="text-gray-600 text-justify leading-relaxed space-y-3">
                  <p>
                    {t('about.features.expertGuidance.description')}
                  </p>
                </div>
              </Card>
            </div>
          </div>

          {/* Founder Story */}
          <div className="mb-16">
            <h2 className="text-3xl font-bold text-center mb-8">{t('about.founderStory.title')}</h2>
            <div className="prose max-w-4xl mx-auto text-gray-600 text-justify leading-relaxed">
              <p className="text-lg mb-6">
                {t('about.founderStory.description')}
              </p>
              <p className="text-lg mb-6">
                {t('about.founderStory.founder')}
              </p>
            </div>
          </div>

          {/* Trust & Independence */}
          <div className="mb-16">
            <h2 className="text-3xl font-bold text-center mb-8">{t('about.trust.title')}</h2>
            <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-8">
              <Card className="p-8">
                <div className="flex items-center mb-6">
                  <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mr-4">
                    <Shield className="w-6 h-6 text-green-600" />
                  </div>
                  <h3 className="text-xl font-semibold">{t('about.trust.security')}</h3>
                </div>
                <div className="text-gray-600 text-justify leading-relaxed space-y-3">
                  <p>
                    {t('about.trust.securityDescription')}
                  </p>
                  <p className="text-sm text-gray-500 italic">
                    Your business ideas and plans are stored securely and never shared with third parties. We use industry-standard encryption and comply with Austrian data protection laws.
                  </p>
                </div>
              </Card>

              <Card className="p-8">
                <div className="flex items-center mb-6">
                  <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mr-4">
                    <Lock className="w-6 h-6 text-blue-600" />
                  </div>
                  <h3 className="text-xl font-semibold">{t('about.trust.independence')}</h3>
                </div>
                <div className="text-gray-600 text-justify leading-relaxed space-y-3">
                  <p>
                    {t('about.trust.independenceDescription')}
                  </p>
                </div>
              </Card>
            </div>
          </div>

          {/* Contact Support */}
          <div className="text-center mb-8">
            <p className="text-gray-600 mb-6 text-lg">
              {t('about.contact.support')}
            </p>
            <Link 
              href="/contact" 
              className="inline-flex items-center gap-3 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium shadow-lg hover:shadow-xl"
            >
              <Mail className="w-5 h-5" />
              {t('about.contact.button')}
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

        </div>
        
        <CTAStrip
          title={t('cta.readyToStartJourney')}
          subtitle={t('cta.joinHundreds')}
          primaryAction={{
            label: t('cta.findYourFunding'),
            href: "/reco"
          }}
          secondaryAction={{
            label: t('cta.getInTouch'),
            href: "/contact"
          }}
        />
      </main>
    </>
  );
}