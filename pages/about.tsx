import { Card } from "@/components/ui/card";
import HeroLite from "@/components/common/HeroLite";
import CTAStrip from "@/components/common/CTAStrip";
import SEOHead from "@/components/common/SEOHead";
import { useI18n } from "@/contexts/I18nContext";
import { Target, Lightbulb, FileText, Search, BookOpen, Shield, Lock, Heart, Users, Mail } from "lucide-react";
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
          <div className="grid md:grid-cols-2 gap-8 mb-16">
            <Card className="p-8">
              <div className="flex items-center mb-4">
                <Target className="w-8 h-8 text-blue-600 mr-3" />
                <h2 className="text-2xl font-semibold">{t('about.mission.title')}</h2>
              </div>
              <p className="text-gray-600">
                {t('about.mission.description')}
              </p>
            </Card>

            <Card className="p-8">
              <div className="flex items-center mb-4">
                <Lightbulb className="w-8 h-8 text-yellow-600 mr-3" />
                <h2 className="text-2xl font-semibold">{t('about.vision.title')}</h2>
              </div>
              <p className="text-gray-600">
                {t('about.vision.description')}
              </p>
            </Card>
          </div>

          {/* How Plan2Fund Helps You */}
          <div className="mb-16">
            <h2 className="text-3xl font-bold text-center mb-12">{t('about.features.title')}</h2>
            <div className="grid md:grid-cols-3 gap-8">
              <Card className="p-6 text-center hover:shadow-lg transition-shadow">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Search className="w-8 h-8 text-blue-600" />
                </div>
                <h3 className="text-xl font-semibold mb-3">{t('about.features.smartMatching.title')}</h3>
                <p className="text-gray-600">
                  {t('about.features.smartMatching.description')}
                </p>
              </Card>

              <Card className="p-6 text-center hover:shadow-lg transition-shadow">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <FileText className="w-8 h-8 text-green-600" />
                </div>
                <h3 className="text-xl font-semibold mb-3">{t('about.features.professionalPlans.title')}</h3>
                <p className="text-gray-600">
                  {t('about.features.professionalPlans.description')}
                </p>
              </Card>

              <Card className="p-6 text-center hover:shadow-lg transition-shadow">
                <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <BookOpen className="w-8 h-8 text-purple-600" />
                </div>
                <h3 className="text-xl font-semibold mb-3">{t('about.features.expertGuidance.title')}</h3>
                <p className="text-gray-600">
                  {t('about.features.expertGuidance.description')}
                </p>
              </Card>
            </div>
          </div>

          {/* Founder Story & Values */}
          <div className="mb-16">
            <h2 className="text-3xl font-bold text-center mb-8">{t('about.founderStory.title')}</h2>
            <div className="prose max-w-3xl mx-auto text-gray-600">
              <p className="text-lg mb-6">
                {t('about.founderStory.description')}
              </p>
              <p className="text-lg mb-6">
                {t('about.founderStory.founder')}
              </p>
              
              {/* Values Section */}
              <div className="mt-8 p-6 bg-gray-50 rounded-lg">
                <h3 className="text-xl font-semibold mb-4 text-center">{t('about.values.title')}</h3>
                <div className="flex flex-wrap justify-center gap-6">
                  <div className="flex items-center gap-2">
                    <Heart className="w-5 h-5 text-red-500" />
                    <span className="font-medium">{t('about.values.transparency')}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Users className="w-5 h-5 text-blue-500" />
                    <span className="font-medium">{t('about.values.fairness')}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Lightbulb className="w-5 h-5 text-yellow-500" />
                    <span className="font-medium">{t('about.values.innovation')}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Trust & Independence */}
          <div className="mb-16">
            <h2 className="text-3xl font-bold text-center mb-8">{t('about.trust.title')}</h2>
            <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
              <Card className="p-6">
                <div className="flex items-center mb-4">
                  <Shield className="w-8 h-8 text-green-600 mr-3" />
                  <h3 className="text-xl font-semibold">{t('about.trust.security')}</h3>
                </div>
                <p className="text-gray-600">
                  {t('about.trust.securityDescription')}
                </p>
              </Card>

              <Card className="p-6">
                <div className="flex items-center mb-4">
                  <Lock className="w-8 h-8 text-blue-600 mr-3" />
                  <h3 className="text-xl font-semibold">{t('about.trust.independence')}</h3>
                </div>
                <p className="text-gray-600">
                  {t('about.trust.independenceDescription')}
                </p>
              </Card>
            </div>
          </div>

          {/* Contact Support */}
          <div className="text-center mb-8">
            <p className="text-gray-600 mb-4">
              {t('about.contact.support')}
            </p>
            <Link 
              href="/contact" 
              className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-800 font-medium"
            >
              <Mail className="w-4 h-4" />
              Contact Support
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