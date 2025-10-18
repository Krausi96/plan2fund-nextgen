import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { useRouter } from "next/router";
import { ArrowLeft, ExternalLink, Users, Calendar, FileText, Target } from "lucide-react";
import { useState, useEffect } from "react";
import { useI18n } from "@/contexts/I18nContext";

interface Program {
  id: string;
  name: string;
  description: string;
  type: string;
  country: string;
  amount: {
    min: number;
    max: number;
    currency: string;
  };
  timeline: string;
  successRate: number;
  requirements: string[];
  documents: string[];
  eligibility: {
    sectors: string[];
    stages: string[];
    companySize: string[];
    other: string[];
  };
  source: string;
  lastUpdated: string;
}

export default function ProgramDetailsPage() {
  const { t } = useI18n();
  const router = useRouter();
  const { id } = router.query;
  const [program, setProgram] = useState<Program | null>(null);
  const [loading, setLoading] = useState(true);
  const [eligibilityCheck, setEligibilityCheck] = useState<{
    [key: string]: boolean;
  }>({});

  useEffect(() => {
    if (id) {
      loadProgram(id as string);
    }
  }, [id]);

  const loadProgram = async (programId: string) => {
    try {
      // Try to load from localStorage first
      const savedPrograms = JSON.parse(localStorage.getItem('programs') || '[]');
      const foundProgram = savedPrograms.find((p: Program) => p.id === programId);
      
      if (foundProgram) {
        setProgram(foundProgram);
      } else {
        // Load from API or create sample data
        const sampleProgram: Program = {
          id: programId,
          name: t("program.ffgName"),
          description: "The FFG eCall program provides funding for research and development projects in Austria. It supports innovative projects across various sectors with a focus on technological advancement and economic impact.",
          type: t("program.type"),
          country: t("program.country"),
          amount: {
            min: 10000,
            max: 500000,
            currency: "EUR"
          },
          timeline: "6-12 months",
          successRate: 0.35,
          requirements: [
            t("program.eligibility"),
            t("program.innovativeRd"),
            t("program.marketPotential"),
            t("program.experiencedTeam"),
            t("program.detailedPlan")
          ],
          documents: [
            t("program.projectProposal"),
            t("program.financialStatements"),
            t("program.teamCvs"),
            t("program.marketAnalysis"),
            t("program.technicalDocumentation")
          ],
          eligibility: {
            sectors: t("program.sectors").split(", "),
            stages: t("program.stages").split(", "),
            companySize: t("program.companySize").split(", "),
            other: t("program.other").split(", ")
          },
          source: "https://www.ffg.at/en/ecall",
          lastUpdated: "2024-01-15"
        };
        setProgram(sampleProgram);
      }
    } catch (error) {
      console.error('Error loading program:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEligibilityCheck = (requirement: string) => {
    setEligibilityCheck(prev => ({
      ...prev,
      [requirement]: !prev[requirement]
    }));
  };

  const getEligibilityScore = () => {
    const total = program?.requirements.length || 0;
    const checked = Object.values(eligibilityCheck).filter(Boolean).length;
    return total > 0 ? Math.round((checked / total) * 100) : 0;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading program details...</p>
        </div>
      </div>
    );
  }

  if (!program) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Program Not Found</h1>
          <p className="text-gray-600 mb-6">The requested program could not be found.</p>
          <Link href="/reco">
            <Button>Back to Recommendations</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <Link href="/reco" className="inline-flex items-center text-blue-600 hover:text-blue-800 mb-4">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Recommendations
        </Link>
        
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">{program.name}</h1>
            <div className="flex items-center gap-4 text-sm text-gray-600 mb-4">
              <span className="flex items-center">
                <Target className="w-4 h-4 mr-1" />
                {program.type}
              </span>
              <span className="flex items-center">
                <Users className="w-4 h-4 mr-1" />
                {program.country}
              </span>
              <span className="flex items-center">
                <Calendar className="w-4 h-4 mr-1" />
                Updated {program.lastUpdated}
              </span>
            </div>
          </div>
          
          {program.source && (
            <a
              href={program.source}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              <ExternalLink className="w-4 h-4 mr-2" />
              Official Source
            </a>
          )}
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-8">
          {/* Description */}
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">Program Description</h2>
            <p className="text-gray-700 leading-relaxed">{program.description}</p>
          </Card>

          {/* Key Information */}
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">Key Information</h2>
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h3 className="font-medium text-gray-900 mb-2">Funding Amount</h3>
                <p className="text-2xl font-bold text-green-600">
                  {program.amount.min.toLocaleString()} - {program.amount.max.toLocaleString()} {program.amount.currency}
                </p>
              </div>
              <div>
                <h3 className="font-medium text-gray-900 mb-2">Timeline</h3>
                <p className="text-lg text-gray-700">{program.timeline}</p>
              </div>
              <div>
                <h3 className="font-medium text-gray-900 mb-2">Success Rate</h3>
                <p className="text-lg text-gray-700">{Math.round(program.successRate * 100)}%</p>
              </div>
              <div>
                <h3 className="font-medium text-gray-900 mb-2">Program Type</h3>
                <p className="text-lg text-gray-700">{program.type}</p>
              </div>
            </div>
          </Card>

          {/* Eligibility Requirements */}
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">Eligibility Requirements</h2>
            <div className="space-y-4">
              <div>
                <h3 className="font-medium text-gray-900 mb-2">Sectors</h3>
                <div className="flex flex-wrap gap-2">
                  {program.eligibility.sectors.map((sector, index) => (
                    <span key={index} className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
                      {sector}
                    </span>
                  ))}
                </div>
              </div>
              
              <div>
                <h3 className="font-medium text-gray-900 mb-2">Company Stages</h3>
                <div className="flex flex-wrap gap-2">
                  {program.eligibility.stages.map((stage, index) => (
                    <span key={index} className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm">
                      {stage}
                    </span>
                  ))}
                </div>
              </div>
              
              <div>
                <h3 className="font-medium text-gray-900 mb-2">Company Size</h3>
                <div className="flex flex-wrap gap-2">
                  {program.eligibility.companySize.map((size, index) => (
                    <span key={index} className="px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-sm">
                      {size}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </Card>

          {/* Required Documents */}
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">Required Documents</h2>
            <ul className="space-y-2">
              {program.documents.map((doc, index) => (
                <li key={index} className="flex items-center">
                  <FileText className="w-4 h-4 text-gray-400 mr-3" />
                  <span className="text-gray-700">{doc}</span>
                </li>
              ))}
            </ul>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Eligibility Checker */}
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">Eligibility Checker</h2>
            <div className="space-y-3">
              {program.requirements.map((requirement, index) => (
                <label key={index} className="flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={eligibilityCheck[requirement] || false}
                    onChange={() => handleEligibilityCheck(requirement)}
                    className="mr-3"
                  />
                  <span className="text-sm text-gray-700">{requirement}</span>
                </label>
              ))}
            </div>
            
            <div className="mt-6 p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700">Eligibility Score</span>
                <span className="text-lg font-bold text-blue-600">{getEligibilityScore()}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${getEligibilityScore()}%` }}
                ></div>
              </div>
            </div>
          </Card>

          {/* Action Buttons */}
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">Next Steps</h2>
            <div className="space-y-3">
              <Link 
                href={`/editor?programId=${program.id}&route=${program.type?.toLowerCase() || 'grant'}&product=submission`} 
                className="block"
              >
                <Button className="w-full bg-blue-600 hover:bg-blue-700">
                  Create Business Plan
                </Button>
              </Link>
              
              <Link href="/reco" className="block">
                <Button variant="outline" className="w-full">
                  Find Similar Programs
                </Button>
              </Link>
              
              <Link href="/contact" className="block">
                <Button variant="outline" className="w-full">
                  Get Expert Help
                </Button>
              </Link>
            </div>
          </Card>

          {/* Program Stats */}
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">Program Statistics</h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Success Rate</span>
                <span className="font-medium">{Math.round(program.successRate * 100)}%</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Average Processing</span>
                <span className="font-medium">{program.timeline}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Last Updated</span>
                <span className="font-medium">{program.lastUpdated}</span>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
