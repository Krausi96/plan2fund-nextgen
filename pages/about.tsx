import { Card } from "@/components/ui/card";
import HeroLite from "@/components/common/HeroLite";
import CTAStrip from "@/components/common/CTAStrip";
import SEOHead from "@/components/common/SEOHead";
import { useI18n } from "@/contexts/I18nContext";
import { Target, Lightbulb, FileText, Search, BookOpen } from "lucide-react";

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
                <h2 className="text-2xl font-semibold">Our Mission</h2>
              </div>
              <p className="text-gray-600">
                Our mission is to level the playing field by making professional business planning accessible to every founder in Austria and the EU.
              </p>
            </Card>

            <Card className="p-8">
              <div className="flex items-center mb-4">
                <Lightbulb className="w-8 h-8 text-yellow-600 mr-3" />
                <h2 className="text-2xl font-semibold">Our Vision</h2>
              </div>
              <p className="text-gray-600">
                Our vision is a future where great ideas receive the funding they deserve.
              </p>
            </Card>
          </div>

          {/* How Plan2Fund Helps You */}
          <div className="mb-16">
            <h2 className="text-3xl font-bold text-center mb-12">How Plan2Fund Helps You</h2>
            <div className="grid md:grid-cols-3 gap-8">
              <Card className="p-6 text-center hover:shadow-lg transition-shadow">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Search className="w-8 h-8 text-blue-600" />
                </div>
                <h3 className="text-xl font-semibold mb-3">Smart Matching & Funding Database</h3>
                <p className="text-gray-600">
                  AI-powered matching of business ideas to hundreds of Austrian/EU programs. Filter by industry, region and stage.
                </p>
              </Card>

              <Card className="p-6 text-center hover:shadow-lg transition-shadow">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <FileText className="w-8 h-8 text-green-600" />
                </div>
                <h3 className="text-xl font-semibold mb-3">Professional Plan Builder</h3>
                <p className="text-gray-600">
                  Guided editor produces compliant, investor-ready business plans with templates and examples.
                </p>
              </Card>

              <Card className="p-6 text-center hover:shadow-lg transition-shadow">
                <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <BookOpen className="w-8 h-8 text-purple-600" />
                </div>
                <h3 className="text-xl font-semibold mb-3">Expert Guidance & Learning</h3>
                <p className="text-gray-600">
                  Getting-started guides, webinars and one-on-one consultations to help you succeed.
                </p>
              </Card>
            </div>
          </div>

          {/* Founder Story & Values */}
          <div className="mb-16">
            <h2 className="text-3xl font-bold text-center mb-8">Our Story</h2>
            <div className="prose max-w-3xl mx-auto text-gray-600">
              <p className="text-lg mb-6">
                Plan2Fund was born from a simple observation: too many brilliant entrepreneurs 
                struggle to access funding not because their ideas aren't good enough, but because 
                they lack the resources to create professional business plans and navigate the 
                complex world of funding opportunities.
              </p>
              <p className="text-lg mb-6">
                Our founder, having experienced this challenge firsthand, set out to create a 
                solution that would level the playing field. We built Plan2Fund to be the bridge 
                between great ideas and the funding they deserve.
              </p>
              <p className="text-lg mb-6">
                We believe in transparency, fairness and innovation. Plan2Fund is an independent 
                platform working with program partners (aws, FFG, EU) to help entrepreneurs 
                access the funding they need to succeed.
              </p>
            </div>
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