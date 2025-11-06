import { Card } from "@/shared/components/ui/card";
import HeroLite from '@/shared/components/common/HeroLite';
import CTAStrip from '@/shared/components/common/CTAStrip';
import SEOHead from '@/shared/components/common/SEOHead';
import { useI18n } from "@/shared/contexts/I18nContext";
import { Mail, ArrowRight } from "lucide-react";
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
        
        <div className="max-w-7xl mx-auto px-4 py-12">
          <h1 className="sr-only">{t('about.title')}</h1>

          {/* Mission & Vision */}
          <div className="max-w-7xl mx-auto grid md:grid-cols-2 gap-8 mb-16">
            <Card className="p-10 hover:shadow-lg transition-shadow">
              <div className="flex items-center mb-6">
                <div className="w-20 h-20 bg-blue-50 rounded-lg flex items-center justify-center mr-6 flex-shrink-0">
                  <span className="text-3xl">🎯</span>
                </div>
                <h2 className="text-2xl font-semibold text-gray-900">{t('about.mission.title')}</h2>
              </div>
              <p className="text-gray-600 leading-relaxed text-left text-lg">
                {t('about.mission.description')}
              </p>
            </Card>

            <Card className="p-10 hover:shadow-lg transition-shadow">
              <div className="flex items-center mb-6">
                <div className="w-20 h-20 bg-yellow-50 rounded-2xl flex items-center justify-center mr-6 flex-shrink-0">
                  <span className="text-3xl">💡</span>
                </div>
                <h2 className="text-2xl font-semibold text-gray-900">{t('about.vision.title')}</h2>
              </div>
              <p className="text-gray-600 leading-relaxed text-left text-lg">
                {t('about.vision.description')}
              </p>
            </Card>
          </div>

          {/* How Plan2Fund Helps You */}
          <div className="mb-16">
            <h2 className="text-3xl font-bold text-center mb-12">{t('about.features.title')}</h2>
            <div className="max-w-7xl mx-auto grid md:grid-cols-3 gap-8">
              <Card className="p-10 hover:shadow-lg transition-shadow">
                <div className="w-20 h-20 bg-blue-50 rounded-2xl flex items-center justify-center mx-auto mb-6">
                  <span className="text-3xl">🔍</span>
                </div>
                <h3 className="text-xl font-semibold mb-4 text-center text-gray-900">{t('about.features.smartMatching.title')}</h3>
                <div className="text-gray-600 leading-relaxed text-left text-lg">
                  <p>
                    {t('about.features.smartMatching.description')}
                  </p>
                </div>
              </Card>

              <Card className="p-10 hover:shadow-lg transition-shadow">
                <div className="w-20 h-20 bg-green-50 rounded-lg flex items-center justify-center mx-auto mb-6">
                  <span className="text-3xl">📋</span>
                </div>
                <h3 className="text-xl font-semibold mb-4 text-center text-gray-900">{t('about.features.professionalPlans.title')}</h3>
                <div className="text-gray-600 leading-relaxed text-left text-lg">
                  <p>
                    {t('about.features.professionalPlans.description')}
                  </p>
                </div>
              </Card>

              <Card className="p-10 hover:shadow-lg transition-shadow">
                <div className="w-20 h-20 bg-purple-50 rounded-lg flex items-center justify-center mx-auto mb-6">
                  <span className="text-3xl">📚</span>
                </div>
                <h3 className="text-xl font-semibold mb-4 text-center text-gray-900">{t('about.features.expertGuidance.title')}</h3>
                <div className="text-gray-600 leading-relaxed text-left text-lg">
                  <p>
                    {t('about.features.expertGuidance.description')}
                  </p>
                </div>
              </Card>
            </div>
          </div>

          {/* Founder Story */}
          <div className="mb-16">
            <div className="max-w-6xl mx-auto">
              <h2 className="text-3xl font-bold text-center mb-12">{t('about.founderStory.title')}</h2>
              <div className="bg-blue-50 rounded-lg p-8 md:p-12 border border-blue-100">
                <div className="max-w-4xl mx-auto">
                  <div className="flex items-start mb-8">
                    <div className="w-16 h-16 bg-blue-50 rounded-lg flex items-center justify-center mr-6 flex-shrink-0">
                      <span className="text-3xl">💡</span>
                    </div>
                    <div className="flex-1">
                      <h3 className="text-xl font-semibold text-gray-900 mb-4">{t('about.founderStory.problemTitle')}</h3>
                      <p className="text-gray-700 leading-relaxed text-left">
                        {t('about.founderStory.description')}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-start">
                    <div className="w-16 h-16 bg-green-50 rounded-2xl flex items-center justify-center mr-6 flex-shrink-0">
                      <span className="text-3xl">🚀</span>
                    </div>
                    <div className="flex-1">
                      <h3 className="text-xl font-semibold text-gray-900 mb-4">{t('about.founderStory.solutionTitle')}</h3>
                      <p className="text-gray-700 leading-relaxed text-left">
                        {t('about.founderStory.founder')}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Trust & Independence */}
          <div className="mb-16">
            <h2 className="text-3xl font-bold text-center mb-12">{t('about.trust.title')}</h2>
            <div className="max-w-7xl mx-auto grid md:grid-cols-3 gap-8">
              <Card className="p-10 hover:shadow-lg transition-shadow">
                <div className="flex items-center mb-6">
                  <div className="w-20 h-20 bg-green-50 rounded-2xl flex items-center justify-center mr-6 flex-shrink-0">
                    <span className="text-3xl">🛡️</span>
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900">{t('about.trust.security')}</h3>
                </div>
                <div className="text-gray-600 leading-relaxed space-y-4 text-left text-lg">
                  <p>
                    {t('about.trust.securityDescription')}
                  </p>
                  <p className="text-sm text-gray-500 italic bg-gray-50 p-3 rounded-lg">
                    {t('about.trust.securityNote')}
                  </p>
                  <Link 
                    href="/privacy" 
                    className="inline-block text-sm text-blue-600 hover:text-blue-800 underline font-medium"
                  >
                    {t('about.trust.dsgvoLink')}
                  </Link>
                </div>
              </Card>

              <Card className="p-10 hover:shadow-lg transition-shadow">
                <div className="flex items-center mb-6">
                  <div className="w-20 h-20 bg-blue-50 rounded-lg flex items-center justify-center mr-6 flex-shrink-0">
                    <span className="text-3xl">⚖️</span>
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900">{t('about.trust.independence')}</h3>
                </div>
                <div className="text-gray-600 leading-relaxed text-left text-lg">
                  <p>
                    {t('about.trust.independenceDescription')}
                  </p>
                </div>
              </Card>

              <Card className="p-10 hover:shadow-lg transition-shadow">
                <div className="flex items-center mb-6">
                  <div className="w-20 h-20 bg-purple-50 rounded-2xl flex items-center justify-center mr-6 flex-shrink-0">
                    <span className="text-3xl">📚</span>
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900">{t('about.trust.quality')}</h3>
                </div>
                <div className="text-gray-600 leading-relaxed text-left text-lg">
                  <p>
                    {t('about.trust.qualityDescription')}
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
              className="inline-flex items-center gap-3 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium shadow-sm hover:shadow-md"
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