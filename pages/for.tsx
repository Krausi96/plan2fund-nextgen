import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import HeroLite from '@/shared/components/common/HeroLite';
import CTAStrip from '@/shared/components/common/CTAStrip';
import SEOHead from '@/shared/components/common/SEOHead';
import analytics from "@/shared/lib/analytics";
import { useI18n } from "@/shared/contexts/I18nContext";
import { 
  Building, 
  Shield, 
  TrendingUp, 
  Handshake, 
  Building2, 
  Users, 
  Target, 
  Rocket, 
  Lightbulb, 
  Zap, 
  GraduationCap, 
  Microscope, 
  BookOpen,
  CheckCircle
} from "lucide-react";

interface UserType {
  id: string;
  title: string;
  subtitle: string;
  icon: any;
  color: string;
  features: Array<{
    icon: any;
    title: string;
    description: string;
  }>;
  programs: Array<{
    name: string;
    description: string;
    color: string;
  }>;
  benefits: Array<{
    title: string;
    description: string;
  }>;
  cta: {
    title: string;
    subtitle: string;
    primaryLabel: string;
    secondaryLabel: string;
  };
}

const getUserTypes = (t: (key: keyof typeof import('../shared/i18n/translations/en.json')) => string): UserType[] => [
  {
    id: "banks",
    title: t("for.banks.title"),
    subtitle: t("for.banks.subtitle"),
    icon: Building,
    color: "purple",
    features: [
      {
        icon: Building,
        title: t("for.banks.features.institutional"),
        description: t("for.banks.features.institutionalDesc")
      },
      {
        icon: Shield,
        title: t("for.banks.features.riskManagement"),
        description: t("for.banks.features.riskManagementDesc")
      },
      {
        icon: TrendingUp,
        title: t("for.banks.features.growthCapital"),
        description: t("for.banks.features.growthCapitalDesc")
      },
      {
        icon: Handshake,
        title: t("for.banks.features.partnerships"),
        description: t("for.banks.features.partnershipsDesc")
      }
    ],
    programs: [
      {
        name: t("for.banks.programs.euInvestment"),
        description: t("for.banks.programs.euInvestmentDesc"),
        color: "border-purple-500"
      },
      {
        name: t("for.banks.programs.institutionalLoans"),
        description: t("for.banks.programs.institutionalLoansDesc"),
        color: "border-blue-500"
      }
    ],
    benefits: [
      {
        title: t("for.banks.benefits.compliance"),
        description: t("for.banks.benefits.complianceDesc")
      },
      {
        title: t("for.banks.benefits.scale"),
        description: t("for.banks.benefits.scaleDesc")
      }
    ],
    cta: {
      title: t("for.banks.cta.title"),
      subtitle: t("for.banks.cta.subtitle"),
      primaryLabel: t("for.banks.cta.primary"),
      secondaryLabel: t("for.banks.cta.secondary")
    }
  },
  {
    id: "sme",
    title: "SMEs & Established Businesses",
    subtitle: "Scale your existing business with strategic funding and expansion plans.",
    icon: Building2,
    color: "blue",
    features: [
      {
        icon: Building2,
        title: t("for.sme.features.scale"),
        description: "Access growth funding and expansion opportunities tailored for established SMEs."
      },
      {
        icon: TrendingUp,
        title: t("for.sme.features.marketExpansion"),
        description: "Find funding programs to enter new markets and expand your operations."
      },
      {
        icon: Users,
        title: t("for.sme.features.teamGrowth"),
        description: "Secure funding for hiring, training, and developing your workforce."
      },
      {
        icon: Target,
        title: t("for.sme.features.technology"),
        description: "Modernize your operations with technology-focused funding programs."
      }
    ],
    programs: [
      {
        name: "KMU-Digitalisierungsbonus",
        description: t("for.sme.programs.digitalizationDesc"),
        color: "border-blue-500"
      },
      {
        name: "FFG Basisprogramm",
        description: "R&D projects with up to €200,000 funding",
        color: "border-green-500"
      },
      {
        name: "EU Funding Programs",
        description: t("for.sme.programs.euFundingDesc"),
        color: "border-purple-500"
      }
    ],
    benefits: [
      {
        title: t("for.sme.benefits.localMarket"),
        description: t("for.sme.benefits.localMarketDesc")
      },
      {
        title: t("for.sme.benefits.quickImplementation"),
        description: t("for.sme.benefits.quickImplementationDesc")
      },
      {
        title: t("for.sme.benefits.complianceReady"),
        description: t("for.sme.benefits.complianceReadyDesc")
      }
    ],
    cta: {
      title: "Ready to scale your business?",
      subtitle: "Find the perfect funding programs for your SME growth plans.",
      primaryLabel: t("for.sme.cta.primary"),
      secondaryLabel: t("for.sme.cta.secondary")
    }
  },
  {
    id: "startups",
    title: t("for.startups.title"),
    subtitle: t("for.startups.subtitle"),
    icon: Rocket,
    color: "green",
    features: [
      {
        icon: Rocket,
        title: t("for.startups.features.preSeed"),
        description: t("for.startups.features.preSeedDesc")
      },
      {
        icon: Lightbulb,
        title: t("for.startups.features.mvp"),
        description: t("for.startups.features.mvpDesc")
      },
      {
        icon: Target,
        title: t("for.startups.features.marketValidation"),
        description: t("for.startups.features.marketValidationDesc")
      },
      {
        icon: Zap,
        title: t("for.startups.features.rapidGrowth"),
        description: t("for.startups.features.rapidGrowthDesc")
      }
    ],
    programs: [
      {
        name: "AWS PreSeed",
        description: t("for.startups.programs.awsDesc"),
        color: "border-blue-500"
      },
      {
        name: "FFG Basisprogramm",
        description: "R&D projects with up to €200,000 funding",
        color: "border-green-500"
      },
      {
        name: "EU Startup Calls",
        description: t("for.startups.programs.euStartupDesc"),
        color: "border-purple-500"
      }
    ],
    benefits: [
      {
        title: t("for.startups.benefits.localExpertise"),
        description: t("for.startups.benefits.localExpertiseDesc")
      },
      {
        title: t("for.startups.benefits.quickImplementation"),
        description: t("for.startups.benefits.quickImplementationDesc")
      },
      {
        title: t("for.startups.benefits.programAwareness"),
        description: t("for.startups.benefits.programAwarenessDesc")
      }
    ],
    cta: {
      title: "Ready to launch your startup?",
      subtitle: "Find the perfect funding programs for your innovative business idea.",
      primaryLabel: t("for.startups.cta.primary"),
      secondaryLabel: t("for.startups.cta.secondary")
    }
  },
  {
    id: "universities",
    title: t("for.universities.title"),
    subtitle: t("for.universities.subtitle"),
    icon: GraduationCap,
    color: "orange",
    features: [
      {
        icon: GraduationCap,
        title: t("for.universities.features.researchGrants"),
        description: t("for.universities.features.researchGrantsDesc")
      },
      {
        icon: Microscope,
        title: t("for.universities.features.innovationProjects"),
        description: t("for.universities.features.innovationProjectsDesc")
      },
      {
        icon: BookOpen,
        title: t("for.universities.features.academicFunding"),
        description: t("for.universities.features.academicFundingDesc")
      },
      {
        icon: Users,
        title: t("for.universities.features.studentSupport"),
        description: t("for.universities.features.studentSupportDesc")
      }
    ],
    programs: [
      {
        name: t("for.universities.programs.horizon"),
        description: t("for.universities.programs.horizonDesc"),
        color: "border-blue-500"
      },
      {
        name: "FFG Research Programs",
        description: t("for.universities.programs.ffgDesc"),
        color: "border-green-500"
      },
      {
        name: t("for.universities.programs.erasmus"),
        description: t("for.universities.programs.erasmusDesc"),
        color: "border-purple-500"
      }
    ],
    benefits: [
      {
        title: t("for.universities.benefits.academicFocus"),
        description: t("for.universities.benefits.academicFocusDesc")
      },
      {
        title: t("for.universities.benefits.researchNetwork"),
        description: t("for.universities.benefits.researchNetworkDesc")
      }
    ],
    cta: {
      title: "Ready to advance your research?",
      subtitle: "Find the perfect funding programs for your academic and research projects.",
      primaryLabel: t("for.universities.cta.primary"),
      secondaryLabel: t("for.universities.cta.secondary")
    }
  }
];

export default function ForPage() {
  const { t } = useI18n();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("sme");
  const userTypes = getUserTypes(t);

  // Handle URL parameters for tab selection
  useEffect(() => {
    if (router.query.tab && typeof router.query.tab === 'string') {
      const validTabs = userTypes.map(type => type.id);
      if (validTabs.includes(router.query.tab)) {
        setActiveTab(router.query.tab);
      }
    }
  }, [router.query.tab]);

  // Track page view and tab changes
  useEffect(() => {
    analytics.trackPageView('/for', 'For Page');
    analytics.trackUserAction('for_page_viewed', { tab: activeTab });
  }, [activeTab]);

  const handleTabChange = (tabId: string) => {
    setActiveTab(tabId);
    analytics.trackUserAction('for_tab_changed', { 
      from_tab: activeTab, 
      to_tab: tabId 
    });
  };

  const activeUserType = userTypes.find(type => type.id === activeTab) || userTypes[0];

  return (
    <>
      <SEOHead 
        pageKey="for"
        title={t("for.pageTitle")}
        description={t("for.pageDescription")}
        schema="organization"
      />
      
      <main>
        <HeroLite
          title={t("for.heroTitle")}
          subtitle={t("for.heroSubtitle")}
          className="bg-gradient-to-br from-blue-50 to-indigo-100"
        />
        
        {/* Tab Navigation */}
        <section className="section-padding bg-white">
          <div className="container">
            <div className="flex flex-wrap justify-center gap-2 mb-12">
              {userTypes.map((type) => (
                <button
                  key={type.id}
                  onClick={() => handleTabChange(type.id)}
                  className={`flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-colors ${
                    activeTab === type.id
                      ? `bg-${type.color}-600 text-white`
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  <type.icon className="w-5 h-5" />
                  {type.title}
                </button>
              ))}
            </div>

            {/* Active Tab Content */}
            <div className="max-w-6xl mx-auto">
              <div className="text-center mb-12">
                <h2 className="text-3xl font-bold text-gray-900 mb-4">
                  {activeUserType.title}
                </h2>
                <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                  {activeUserType.subtitle}
                </p>
              </div>

              {/* Features Grid */}
              <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 mb-12">
                {activeUserType.features.map((feature, index) => (
                  <div key={index} className="text-center">
                    <div className={`bg-${activeUserType.color}-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4`}>
                      <feature.icon className={`h-8 w-8 text-${activeUserType.color}-600`} />
                    </div>
                    <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                    <p className="text-gray-600">{feature.description}</p>
                  </div>
                ))}
              </div>

              <div className="grid lg:grid-cols-2 gap-12">
                {/* Programs */}
                <div>
                  <h3 className="text-2xl font-bold mb-6">Available Programs</h3>
                  <div className="space-y-4">
                    {activeUserType.programs.map((program, index) => (
                      <div key={index} className={`border-l-4 ${program.color} pl-6`}>
                        <h4 className="text-lg font-semibold mb-2">{program.name}</h4>
                        <p className="text-gray-600">{program.description}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Benefits */}
                <div>
                  <h3 className="text-2xl font-bold mb-6">Why Choose Plan2Fund</h3>
                  <ul className="space-y-4">
                    {activeUserType.benefits.map((benefit, index) => (
                      <li key={index} className="flex items-start">
                        <CheckCircle className="text-green-500 mr-3 mt-1 w-5 h-5 flex-shrink-0" />
                        <div>
                          <h4 className="font-semibold">{benefit.title}</h4>
                          <p className="text-gray-600">{benefit.description}</p>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </section>
        
        <CTAStrip
          title={activeUserType.cta.title}
          subtitle={activeUserType.cta.subtitle}
          primaryAction={{
            label: activeUserType.cta.primaryLabel,
            href: "/reco"
          }}
          secondaryAction={{
            label: activeUserType.cta.secondaryLabel,
            href: activeUserType.id === "banks" ? "/contact" : "/pricing"
          }}
        />
      </main>
    </>
  );
}
