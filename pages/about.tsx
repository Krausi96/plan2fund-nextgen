import { Card } from "@/shared/components/ui/card";
import HeroLite from '@/shared/components/common/HeroLite';
import CTAStrip from '@/shared/components/common/CTAStrip';
import SEOHead from '@/shared/components/common/SEOHead';
import { useI18n } from "@/shared/contexts/I18nContext";
import { Mail, ArrowRight, Lightbulb, Search, FileText, BookOpen, Rocket, Shield, Scale, GraduationCap } from "lucide-react";
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
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <h1 className="sr-only">{t('about.title')}</h1>

          {/* Mission & Vision */}
          <div className="grid md:grid-cols-2 gap-8 mb-20">
            <Card className="p-10 rounded-2xl border-2 border-neutral-200 hover:shadow-xl hover:border-blue-200 transition-all duration-300 bg-gradient-to-br from-white to-blue-50/30">
              <div className="flex items-start mb-6">
                <div className="w-20 h-20 bg-gradient-to-br from-blue-100 to-blue-50 rounded-2xl flex items-center justify-center mr-6 flex-shrink-0 shadow-md">
                  <span className="text-3xl">🎯</span>
                </div>
                <div className="flex-1">
                  <h2 className="text-3xl font-bold text-neutral-900 mb-3">{t('about.mission.title')}</h2>
                </div>
              </div>
              <p className="text-neutral-700 leading-relaxed text-lg">
                {t('about.mission.description')}
              </p>
            </Card>

            <Card className="p-10 rounded-2xl border-2 border-neutral-200 hover:shadow-xl hover:border-yellow-200 transition-all duration-300 bg-gradient-to-br from-white to-yellow-50/30">
              <div className="flex items-start mb-6">
                <div className="w-20 h-20 bg-gradient-to-br from-yellow-100 to-yellow-50 rounded-2xl flex items-center justify-center mr-6 flex-shrink-0 shadow-md">
                  <Lightbulb className="w-10 h-10 text-yellow-600" />
                </div>
                <div className="flex-1">
                  <h2 className="text-3xl font-bold text-neutral-900 mb-3">{t('about.vision.title')}</h2>
                </div>
              </div>
              <p className="text-neutral-700 leading-relaxed text-lg">
                {t('about.vision.description')}
              </p>
            </Card>
          </div>

          {/* How Plan2Fund Helps You */}
          <div className="mb-20">
            <h2 className="text-4xl md:text-5xl font-bold text-center mb-6 tracking-tight text-neutral-900">{t('about.features.title')}</h2>
            <div className="grid md:grid-cols-3 gap-8">
              <Card className="p-10 rounded-2xl border-2 border-neutral-200 hover:shadow-xl hover:border-blue-200 transition-all duration-300 bg-white group">
                <div className="w-20 h-20 bg-gradient-to-br from-blue-100 to-blue-50 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-md group-hover:scale-110 transition-transform duration-300">
                  <Search className="w-10 h-10 text-blue-600" />
                </div>
                <h3 className="text-2xl font-bold mb-4 text-center text-neutral-900">{t('about.features.smartMatching.title')}</h3>
                <div className="text-neutral-700 leading-relaxed text-lg text-center">
                  <p>
                    {t('about.features.smartMatching.description')}
                  </p>
                </div>
              </Card>

              <Card className="p-10 rounded-2xl border-2 border-neutral-200 hover:shadow-xl hover:border-green-200 transition-all duration-300 bg-white group">
                <div className="w-20 h-20 bg-gradient-to-br from-green-100 to-green-50 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-md group-hover:scale-110 transition-transform duration-300">
                  <FileText className="w-10 h-10 text-green-600" />
                </div>
                <h3 className="text-2xl font-bold mb-4 text-center text-neutral-900">{t('about.features.professionalPlans.title')}</h3>
                <div className="text-neutral-700 leading-relaxed text-lg text-center">
                  <p>
                    {t('about.features.professionalPlans.description')}
                  </p>
                </div>
              </Card>

              <Card className="p-10 rounded-2xl border-2 border-neutral-200 hover:shadow-xl hover:border-purple-200 transition-all duration-300 bg-white group">
                <div className="w-20 h-20 bg-gradient-to-br from-purple-100 to-purple-50 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-md group-hover:scale-110 transition-transform duration-300">
                  <BookOpen className="w-10 h-10 text-purple-600" />
                </div>
                <h3 className="text-2xl font-bold mb-4 text-center text-neutral-900">{t('about.features.expertGuidance.title')}</h3>
                <div className="text-neutral-700 leading-relaxed text-lg text-center">
                  <p>
                    {t('about.features.expertGuidance.description')}
                  </p>
                </div>
              </Card>
            </div>
          </div>

          {/* Founder Story */}
          <div className="mb-20">
            <div className="max-w-6xl mx-auto">
              <h2 className="text-4xl md:text-5xl font-bold text-center mb-12 tracking-tight text-neutral-900">{t('about.founderStory.title')}</h2>
              <div className="bg-gradient-to-br from-blue-50 via-white to-blue-50/50 rounded-2xl p-10 md:p-14 border-2 border-blue-100 shadow-lg">
                <div className="max-w-4xl mx-auto space-y-10">
                  <div className="flex items-start">
                    <div className="w-20 h-20 bg-gradient-to-br from-blue-100 to-blue-50 rounded-2xl flex items-center justify-center mr-6 flex-shrink-0 shadow-md">
                      <Lightbulb className="w-10 h-10 text-blue-600" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-2xl font-bold text-neutral-900 mb-4">{t('about.founderStory.problemTitle')}</h3>
                      <p className="text-neutral-700 leading-relaxed text-lg">
                        {t('about.founderStory.description')}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-start">
                    <div className="w-20 h-20 bg-gradient-to-br from-green-100 to-green-50 rounded-2xl flex items-center justify-center mr-6 flex-shrink-0 shadow-md">
                      <Rocket className="w-10 h-10 text-green-600" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-2xl font-bold text-neutral-900 mb-4">{t('about.founderStory.solutionTitle')}</h3>
                      <p className="text-neutral-700 leading-relaxed text-lg">
                        {t('about.founderStory.founder')}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Trust & Independence */}
          <div className="mb-20">
            <h2 className="text-4xl md:text-5xl font-bold text-center mb-12 tracking-tight text-neutral-900">{t('about.trust.title')}</h2>
            <div className="grid md:grid-cols-3 gap-8">
              <Card className="p-10 rounded-2xl border-2 border-neutral-200 hover:shadow-xl hover:border-green-200 transition-all duration-300 bg-white group">
                <div className="flex items-start mb-6">
                  <div className="w-20 h-20 bg-gradient-to-br from-green-100 to-green-50 rounded-2xl flex items-center justify-center mr-6 flex-shrink-0 shadow-md group-hover:scale-110 transition-transform duration-300">
                    <Shield className="w-10 h-10 text-green-600" />
                  </div>
                  <h3 className="text-2xl font-bold text-neutral-900">{t('about.trust.security')}</h3>
                </div>
                <div className="text-neutral-700 leading-relaxed space-y-4 text-lg">
                  <p>
                    {t('about.trust.securityDescription')}
                  </p>
                  <p className="text-sm text-neutral-600 italic bg-neutral-50 p-4 rounded-xl border border-neutral-200">
                    {t('about.trust.securityNote')}
                  </p>
                  <Link 
                    href="/privacy" 
                    className="inline-block text-sm text-blue-600 hover:text-blue-800 font-semibold underline decoration-2 underline-offset-2"
                  >
                    {t('about.trust.dsgvoLink')}
                  </Link>
                </div>
              </Card>

              <Card className="p-10 rounded-2xl border-2 border-neutral-200 hover:shadow-xl hover:border-blue-200 transition-all duration-300 bg-white group">
                <div className="flex items-start mb-6">
                  <div className="w-20 h-20 bg-gradient-to-br from-blue-100 to-blue-50 rounded-2xl flex items-center justify-center mr-6 flex-shrink-0 shadow-md group-hover:scale-110 transition-transform duration-300">
                    <Scale className="w-10 h-10 text-blue-600" />
                  </div>
                  <h3 className="text-2xl font-bold text-neutral-900">{t('about.trust.independence')}</h3>
                </div>
                <div className="text-neutral-700 leading-relaxed text-lg">
                  <p>
                    {t('about.trust.independenceDescription')}
                  </p>
                </div>
              </Card>

              <Card className="p-10 rounded-2xl border-2 border-neutral-200 hover:shadow-xl hover:border-purple-200 transition-all duration-300 bg-white group">
                <div className="flex items-start mb-6">
                  <div className="w-20 h-20 bg-gradient-to-br from-purple-100 to-purple-50 rounded-2xl flex items-center justify-center mr-6 flex-shrink-0 shadow-md group-hover:scale-110 transition-transform duration-300">
                    <GraduationCap className="w-10 h-10 text-purple-600" />
                  </div>
                  <h3 className="text-2xl font-bold text-neutral-900">{t('about.trust.quality')}</h3>
                </div>
                <div className="text-neutral-700 leading-relaxed text-lg">
                  <p>
                    {t('about.trust.qualityDescription')}
                  </p>
                </div>
              </Card>
            </div>
          </div>

          {/* Contact Support */}
          <div className="text-center mb-8">
            <p className="text-neutral-700 mb-8 text-xl">
              {t('about.contact.support')}
            </p>
            <Link 
              href="/contact" 
              className="inline-flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all duration-300 font-semibold shadow-lg hover:shadow-xl"
            >
              <Mail className="w-5 h-5" />
              {t('about.contact.button')}
              <ArrowRight className="w-5 h-5" />
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