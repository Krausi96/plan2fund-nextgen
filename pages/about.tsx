import { Card } from "@/shared/components/ui/card";
import HeroLite from '@/shared/components/common/HeroLite';
import CTAStrip from '@/shared/components/common/CTAStrip';
import SEOHead from '@/shared/components/common/SEOHead';
import { useI18n } from "@/shared/contexts/I18nContext";
import { Mail, ArrowRight, Lightbulb, Search, FileText, BookOpen, Shield, Scale, GraduationCap } from "lucide-react";
import Link from "next/link";

export default function AboutPage() {
  const { t } = useI18n();

  return (
    <>
      <SEOHead pageKey="about" />
      
      <main className="bg-gray-50">
        <HeroLite
          title={t('about.title')}
          subtitle={t('about.subtitle')}
        />
        
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <h1 className="sr-only">{t('about.title')}</h1>

          {/* Mission & Vision - Combined */}
          <div className="mb-16">
            <div className="grid md:grid-cols-2 gap-8 mb-12">
              <Card className="p-8 rounded-2xl border-2 border-neutral-200 hover:shadow-lg hover:border-blue-200 transition-all bg-gradient-to-br from-white to-blue-50/30">
                <div className="flex items-center mb-4">
                  <div className="w-16 h-16 bg-gradient-to-br from-blue-100 to-blue-50 rounded-xl flex items-center justify-center mr-4 flex-shrink-0">
                    <span className="text-2xl">🎯</span>
                  </div>
                  <h2 className="text-2xl font-bold text-neutral-900">{t('about.mission.title')}</h2>
                </div>
                <p className="text-neutral-700 leading-relaxed">
                  {t('about.mission.description')}
                </p>
              </Card>

              <Card className="p-8 rounded-2xl border-2 border-neutral-200 hover:shadow-lg hover:border-yellow-200 transition-all bg-gradient-to-br from-white to-yellow-50/30">
                <div className="flex items-center mb-4">
                  <div className="w-16 h-16 bg-gradient-to-br from-yellow-100 to-yellow-50 rounded-xl flex items-center justify-center mr-4 flex-shrink-0">
                    <Lightbulb className="w-8 h-8 text-yellow-600" />
                  </div>
                  <h2 className="text-2xl font-bold text-neutral-900">{t('about.vision.title')}</h2>
                </div>
                <p className="text-neutral-700 leading-relaxed">
                  {t('about.vision.description')}
                </p>
              </Card>
            </div>
          </div>

          {/* Key Features - Simplified */}
          <div className="mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-center mb-8 tracking-tight text-neutral-900">{t('about.features.title')}</h2>
            <div className="grid md:grid-cols-3 gap-6">
              <Card className="p-8 rounded-2xl border-2 border-neutral-200 hover:shadow-lg hover:border-blue-300 transition-all bg-white shadow-sm">
                <div className="w-16 h-16 bg-gradient-to-br from-blue-100 to-blue-50 rounded-xl flex items-center justify-center mx-auto mb-4">
                  <Search className="w-8 h-8 text-blue-600" />
                </div>
                <h3 className="text-xl font-bold mb-3 text-center text-neutral-900">{t('about.features.smartMatching.title')}</h3>
                <p className="text-neutral-700 leading-relaxed text-center text-sm">
                  {t('about.features.smartMatching.description')}
                </p>
              </Card>

              <Card className="p-8 rounded-2xl border-2 border-neutral-200 hover:shadow-lg hover:border-green-200 transition-all bg-white">
                <div className="w-16 h-16 bg-gradient-to-br from-green-100 to-green-50 rounded-xl flex items-center justify-center mx-auto mb-4">
                  <FileText className="w-8 h-8 text-green-600" />
                </div>
                <h3 className="text-xl font-bold mb-3 text-center text-neutral-900">{t('about.features.professionalPlans.title')}</h3>
                <p className="text-neutral-700 leading-relaxed text-center text-sm">
                  {t('about.features.professionalPlans.description')}
                </p>
              </Card>

              <Card className="p-8 rounded-2xl border-2 border-neutral-200 hover:shadow-lg hover:border-purple-200 transition-all bg-white">
                <div className="w-16 h-16 bg-gradient-to-br from-purple-100 to-purple-50 rounded-xl flex items-center justify-center mx-auto mb-4">
                  <BookOpen className="w-8 h-8 text-purple-600" />
                </div>
                <h3 className="text-xl font-bold mb-3 text-center text-neutral-900">{t('about.features.expertGuidance.title')}</h3>
                <p className="text-neutral-700 leading-relaxed text-center text-sm">
                  {t('about.features.expertGuidance.description')}
                </p>
              </Card>
            </div>
          </div>

          {/* Our Story - Simplified */}
          <div className="mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-center mb-8 tracking-tight text-neutral-900">{t('about.founderStory.title')}</h2>
            <Card className="bg-gradient-to-br from-blue-50 via-white to-blue-50/50 rounded-2xl p-8 md:p-10 border-2 border-blue-100">
              <p className="text-neutral-700 leading-relaxed text-lg mb-4">
                {t('about.founderStory.description')}
              </p>
              <p className="text-neutral-700 leading-relaxed text-lg">
                {t('about.founderStory.founder')}
              </p>
            </Card>
          </div>

          {/* Trust & Independence - Simplified */}
          <div className="mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-center mb-8 tracking-tight text-neutral-900">{t('about.trust.title')}</h2>
            <div className="grid md:grid-cols-3 gap-6">
              <Card className="p-8 rounded-2xl border-2 border-neutral-200 hover:shadow-lg hover:border-green-200 transition-all bg-white">
                <div className="w-16 h-16 bg-gradient-to-br from-green-100 to-green-50 rounded-xl flex items-center justify-center mb-4">
                  <Shield className="w-8 h-8 text-green-600" />
                </div>
                <h3 className="text-xl font-bold mb-3 text-neutral-900">{t('about.trust.security')}</h3>
                <p className="text-neutral-700 leading-relaxed text-sm mb-3">
                  {t('about.trust.securityDescription')}
                </p>
                <Link 
                  href="/privacy" 
                  className="text-sm text-blue-600 hover:text-blue-800 font-semibold underline decoration-2 underline-offset-2"
                >
                  {t('about.trust.dsgvoLink')}
                </Link>
              </Card>

              <Card className="p-8 rounded-2xl border-2 border-neutral-200 hover:shadow-lg hover:border-blue-300 transition-all bg-white shadow-sm">
                <div className="w-16 h-16 bg-gradient-to-br from-blue-100 to-blue-50 rounded-xl flex items-center justify-center mb-4">
                  <Scale className="w-8 h-8 text-blue-600" />
                </div>
                <h3 className="text-xl font-bold mb-3 text-neutral-900">{t('about.trust.independence')}</h3>
                <p className="text-neutral-700 leading-relaxed text-sm">
                  {t('about.trust.independenceDescription')}
                </p>
              </Card>

              <Card className="p-8 rounded-2xl border-2 border-neutral-200 hover:shadow-lg hover:border-purple-200 transition-all bg-white">
                <div className="w-16 h-16 bg-gradient-to-br from-purple-100 to-purple-50 rounded-xl flex items-center justify-center mb-4">
                  <GraduationCap className="w-8 h-8 text-purple-600" />
                </div>
                <h3 className="text-xl font-bold mb-3 text-neutral-900">{t('about.trust.quality')}</h3>
                <p className="text-neutral-700 leading-relaxed text-sm">
                  {t('about.trust.qualityDescription')}
                </p>
              </Card>
            </div>
          </div>

          {/* Contact Support - Simplified */}
          <div className="text-center">
            <p className="text-neutral-700 mb-6 text-lg">
              {t('about.contact.support')}
            </p>
            <Link 
              href="/contact" 
              className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all font-semibold shadow-md hover:shadow-lg"
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