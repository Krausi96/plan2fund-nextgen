import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import HeroLite from "@/components/common/HeroLite";
import CTAStrip from "@/components/common/CTAStrip";
import SEOHead from "@/components/common/SEOHead";
import analytics from "@/lib/analytics";
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

const userTypes: UserType[] = [
  {
    id: "banks",
    title: "Banks & Financial Institutions",
    subtitle: "Access institutional funding programs and partnership opportunities for your financial institution.",
    icon: Building,
    color: "purple",
    features: [
      {
        icon: Building,
        title: "Institutional Funding",
        description: "Access large-scale funding programs for institutional and corporate clients."
      },
      {
        icon: Shield,
        title: "Risk Management",
        description: "Find funding programs with built-in risk management and compliance features."
      },
      {
        icon: TrendingUp,
        title: "Growth Capital",
        description: "Secure substantial funding for major expansion and development projects."
      },
      {
        icon: Handshake,
        title: "Partnership Programs",
        description: "Access collaborative funding opportunities and partnership programs."
      }
    ],
    programs: [
      {
        name: "EU Investment Programs",
        description: "Large-scale investment programs for financial institutions",
        color: "border-purple-500"
      },
      {
        name: "Institutional Loans",
        description: "Specialized loan programs for banks and financial institutions",
        color: "border-blue-500"
      }
    ],
    benefits: [
      {
        title: "Compliance Focus",
        description: "Programs designed with financial institution requirements in mind"
      },
      {
        title: "Scale Advantage",
        description: "Access to larger funding amounts and institutional programs"
      }
    ],
    cta: {
      title: "Ready to explore institutional funding?",
      subtitle: "Find the perfect funding programs for your financial institution.",
      primaryLabel: "Start Planning",
      secondaryLabel: "Get in Touch"
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
        title: "Scale Your Business",
        description: "Access growth funding and expansion opportunities tailored for established SMEs."
      },
      {
        icon: TrendingUp,
        title: "Market Expansion",
        description: "Find funding programs to enter new markets and expand your operations."
      },
      {
        icon: Users,
        title: "Team Growth",
        description: "Secure funding for hiring, training, and developing your workforce."
      },
      {
        icon: Target,
        title: "Technology Upgrades",
        description: "Modernize your operations with technology-focused funding programs."
      }
    ],
    programs: [
      {
        name: "KMU-Digitalisierungsbonus",
        description: "Up to €12,000 for digitalization projects",
        color: "border-blue-500"
      },
      {
        name: "FFG Basisprogramm",
        description: "R&D projects with up to €200,000 funding",
        color: "border-green-500"
      },
      {
        name: "EU Funding Programs",
        description: "Horizon Europe, COSME and other EU programs",
        color: "border-purple-500"
      }
    ],
    benefits: [
      {
        title: "Local Market Knowledge",
        description: "Optimized for Austrian business practices"
      },
      {
        title: "Quick Implementation",
        description: "Create strategic plans in under 30 minutes"
      },
      {
        title: "Compliance Ready",
        description: "Automatic adherence to Austrian standards"
      }
    ],
    cta: {
      title: "Ready to scale your business?",
      subtitle: "Find the perfect funding programs for your SME growth plans.",
      primaryLabel: "Start Planning",
      secondaryLabel: "View Pricing"
    }
  },
  {
    id: "startups",
    title: "Startups & Entrepreneurs",
    subtitle: "Turn your innovative ideas into reality with comprehensive business planning and early-stage funding.",
    icon: Rocket,
    color: "green",
    features: [
      {
        icon: Rocket,
        title: "Pre-seed Funding",
        description: "Access early-stage funding programs to turn your innovative ideas into reality."
      },
      {
        icon: Lightbulb,
        title: "MVP Development",
        description: "Secure funding for building and testing your minimum viable product."
      },
      {
        icon: Target,
        title: "Market Validation",
        description: "Find programs that help you validate your market and business model."
      },
      {
        icon: Zap,
        title: "Rapid Growth",
        description: "Accelerate your startup's growth with targeted funding opportunities."
      }
    ],
    programs: [
      {
        name: "AWS PreSeed",
        description: "Up to €50,000 for innovative early-stage ideas",
        color: "border-blue-500"
      },
      {
        name: "FFG Basisprogramm",
        description: "R&D projects with up to €200,000 funding",
        color: "border-green-500"
      },
      {
        name: "EU Startup Calls",
        description: "Horizon Europe programs for innovative companies",
        color: "border-purple-500"
      }
    ],
    benefits: [
      {
        title: "Local Expertise",
        description: "Developed specifically for Austrian funding landscape"
      },
      {
        title: "Quick Implementation",
        description: "Create business plans in under 30 minutes"
      },
      {
        title: "Program Awareness",
        description: "Automatic adaptation to funding criteria"
      }
    ],
    cta: {
      title: "Ready to launch your startup?",
      subtitle: "Find the perfect funding programs for your innovative business idea.",
      primaryLabel: "Start Planning",
      secondaryLabel: "View Features"
    }
  },
  {
    id: "universities",
    title: "Universities & Research Institutions",
    subtitle: "Advance your research and academic projects with specialized funding programs.",
    icon: GraduationCap,
    color: "orange",
    features: [
      {
        icon: GraduationCap,
        title: "Research Grants",
        description: "Access academic funding programs for research and development projects."
      },
      {
        icon: Microscope,
        title: "Innovation Projects",
        description: "Secure funding for cutting-edge research and innovation initiatives."
      },
      {
        icon: BookOpen,
        title: "Academic Funding",
        description: "Find funding opportunities for educational and academic programs."
      },
      {
        icon: Users,
        title: "Student Support",
        description: "Access funding programs that support student entrepreneurship and research."
      }
    ],
    programs: [
      {
        name: "Horizon Europe",
        description: "EU research and innovation funding programs",
        color: "border-blue-500"
      },
      {
        name: "FFG Research Programs",
        description: "Austrian research funding for academic institutions",
        color: "border-green-500"
      },
      {
        name: "Erasmus+ Programs",
        description: "Educational and research mobility programs",
        color: "border-purple-500"
      }
    ],
    benefits: [
      {
        title: "Academic Focus",
        description: "Programs designed specifically for research institutions"
      },
      {
        title: "International Reach",
        description: "Access to both Austrian and EU funding programs"
      }
    ],
    cta: {
      title: "Ready to advance your research?",
      subtitle: "Find the perfect funding programs for your academic and research projects.",
      primaryLabel: "Start Planning",
      secondaryLabel: "View Features"
    }
  }
];

export default function ForPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("sme");

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
        title="Funding Programs for Every Business Type - Plan2Fund"
        description="Discover tailored funding programs for startups, SMEs, banks, and universities. Find the perfect funding solution for your business type."
        schema="organization"
      />
      
      <main>
        <HeroLite
          title="Funding Programs for Every Business Type"
          subtitle="Whether you're a startup, established SME, financial institution, or research organization, we have the right funding programs for you."
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
