import { Card } from "@/components/ui/card";
import HeroLite from "@/components/common/HeroLite";
import CTAStrip from "@/components/common/CTAStrip";
import SEOHead from "@/components/common/SEOHead";
import { useI18n } from "@/contexts/I18nContext";
import { Users, Target, Lightbulb, Shield, Zap, FileText, Search, CheckCircle, BookOpen, Download, ExternalLink } from "lucide-react";

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

      {/* Features Section */}
      <div id="features" className="mb-16">
        <h2 className="text-3xl font-bold text-center mb-12">{t('about.features.title')}</h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
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
              <Zap className="w-8 h-8 text-purple-600" />
            </div>
            <h3 className="text-xl font-semibold mb-3">{t('about.features.quickSetup.title')}</h3>
            <p className="text-gray-600">
              {t('about.features.quickSetup.description')}
            </p>
          </Card>

          <Card className="p-6 text-center hover:shadow-lg transition-shadow">
            <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Shield className="w-8 h-8 text-orange-600" />
            </div>
            <h3 className="text-xl font-semibold mb-3">{t('about.features.expertGuidance.title')}</h3>
            <p className="text-gray-600">
              {t('about.features.expertGuidance.description')}
            </p>
          </Card>

          <Card className="p-6 text-center hover:shadow-lg transition-shadow">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-8 h-8 text-red-600" />
            </div>
            <h3 className="text-xl font-semibold mb-3">Compliance Ready</h3>
            <p className="text-gray-600">
              All plans are built to meet Austrian and EU funding program requirements, 
              ensuring your applications are compliant from day one.
            </p>
          </Card>

          <Card className="p-6 text-center hover:shadow-lg transition-shadow">
            <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Users className="w-8 h-8 text-indigo-600" />
            </div>
            <h3 className="text-xl font-semibold mb-3">Team Collaboration</h3>
            <p className="text-gray-600">
              Work together with your team, advisors, and stakeholders on your business plan 
              with real-time collaboration features.
            </p>
          </Card>
        </div>
      </div>

      {/* Resources Section */}
      <div id="resources" className="mb-16">
        <h2 className="text-3xl font-bold text-center mb-12">Resources & Support</h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          <Card className="p-6 hover:shadow-lg transition-shadow">
            <div className="flex items-center mb-4">
              <BookOpen className="w-6 h-6 text-blue-600 mr-3" />
              <h3 className="text-xl font-semibold">Getting Started Guide</h3>
            </div>
            <p className="text-gray-600 mb-4">
              Learn how to create your first business plan and find the right funding opportunities.
            </p>
            <a href="/reco" className="text-blue-600 hover:text-blue-700 font-medium inline-flex items-center">
              Start Guide <ExternalLink className="w-4 h-4 ml-1" />
            </a>
          </Card>

          <Card className="p-6 hover:shadow-lg transition-shadow">
            <div className="flex items-center mb-4">
              <Download className="w-6 h-6 text-green-600 mr-3" />
              <h3 className="text-xl font-semibold">Templates & Examples</h3>
            </div>
            <p className="text-gray-600 mb-4">
              Access professional business plan templates and real-world examples to guide your writing.
            </p>
            <a href="/editor" className="text-green-600 hover:text-green-700 font-medium inline-flex items-center">
              View Templates <ExternalLink className="w-4 h-4 ml-1" />
            </a>
          </Card>

          <Card className="p-6 hover:shadow-lg transition-shadow">
            <div className="flex items-center mb-4">
              <Target className="w-6 h-6 text-purple-600 mr-3" />
              <h3 className="text-xl font-semibold">Funding Program Database</h3>
            </div>
            <p className="text-gray-600 mb-4">
              Explore our comprehensive database of Austrian and EU funding programs with detailed requirements.
            </p>
            <a href="/advanced-search" className="text-purple-600 hover:text-purple-700 font-medium inline-flex items-center">
              Browse Programs <ExternalLink className="w-4 h-4 ml-1" />
            </a>
          </Card>
        </div>
      </div>

      {/* Our Story */}
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
            Our founders, having experienced this challenge firsthand, set out to create a 
            solution that would level the playing field. We built Plan2Fund to be the bridge 
            between great ideas and the funding they deserve.
          </p>
          <p className="text-lg">
            Today, we're proud to help entrepreneurs across Austria and Europe access over 
            €2 billion in funding opportunities, with a success rate that speaks to the 
            quality of our platform and the dedication of our users.
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="bg-gray-50 rounded-2xl p-8 mb-16">
        <h2 className="text-3xl font-bold text-center mb-12">Our Impact</h2>
        <div className="grid md:grid-cols-4 gap-8 text-center">
          <div>
            <div className="text-4xl font-bold text-blue-600 mb-2">500+</div>
            <div className="text-gray-600">Business Plans Created</div>
          </div>
          <div>
            <div className="text-4xl font-bold text-green-600 mb-2">€2M+</div>
            <div className="text-gray-600">Funding Secured</div>
          </div>
          <div>
            <div className="text-4xl font-bold text-purple-600 mb-2">95%</div>
            <div className="text-gray-600">Success Rate</div>
          </div>
          <div>
            <div className="text-4xl font-bold text-orange-600 mb-2">50+</div>
            <div className="text-gray-600">Funding Programs</div>
          </div>
        </div>
      </div>

      {/* Partners */}
      <div id="partners" className="mb-16">
        <h2 className="text-3xl font-bold text-center mb-12">Our Partners</h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          <Card className="p-6 text-center">
            <div className="w-16 h-16 bg-blue-100 rounded-full mx-auto mb-4 flex items-center justify-center">
              <span className="text-2xl font-bold text-blue-600">AWS</span>
            </div>
            <h3 className="text-xl font-semibold mb-2">Austria Wirtschaftsservice</h3>
            <p className="text-gray-600 text-sm">
              Official partner for Austrian startup funding programs and business development support.
            </p>
          </Card>

          <Card className="p-6 text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full mx-auto mb-4 flex items-center justify-center">
              <span className="text-2xl font-bold text-green-600">FFG</span>
            </div>
            <h3 className="text-xl font-semibold mb-2">Austrian Research Promotion Agency</h3>
            <p className="text-gray-600 text-sm">
              Partner for research and innovation funding programs across Austria.
            </p>
          </Card>

          <Card className="p-6 text-center">
            <div className="w-16 h-16 bg-purple-100 rounded-full mx-auto mb-4 flex items-center justify-center">
              <span className="text-2xl font-bold text-purple-600">EU</span>
            </div>
            <h3 className="text-xl font-semibold mb-2">European Union Programs</h3>
            <p className="text-gray-600 text-sm">
              Access to Horizon Europe and other EU funding opportunities for Austrian businesses.
            </p>
          </Card>
        </div>
      </div>

      {/* Team */}
      <div className="mb-16">
        <h2 className="text-3xl font-bold text-center mb-12">Meet Our Team</h2>
        <div className="grid md:grid-cols-3 gap-8">
          <Card className="p-6 text-center">
            <div className="w-24 h-24 bg-gray-200 rounded-full mx-auto mb-4"></div>
            <h3 className="text-xl font-semibold mb-2">Sarah Chen</h3>
            <p className="text-blue-600 mb-2">CEO & Co-Founder</p>
            <p className="text-gray-600 text-sm">
              Former investment banker with 10+ years experience in startup funding and business development.
            </p>
          </Card>

          <Card className="p-6 text-center">
            <div className="w-24 h-24 bg-gray-200 rounded-full mx-auto mb-4"></div>
            <h3 className="text-xl font-semibold mb-2">Marcus Weber</h3>
            <p className="text-blue-600 mb-2">CTO & Co-Founder</p>
            <p className="text-gray-600 text-sm">
              Tech entrepreneur and AI specialist with expertise in natural language processing and recommendation systems.
            </p>
          </Card>

          <Card className="p-6 text-center">
            <div className="w-24 h-24 bg-gray-200 rounded-full mx-auto mb-4"></div>
            <h3 className="text-xl font-semibold mb-2">Anna Petrov</h3>
            <p className="text-blue-600 mb-2">Head of Product</p>
            <p className="text-gray-600 text-sm">
              UX designer and product strategist focused on making complex processes simple and accessible.
            </p>
          </Card>
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