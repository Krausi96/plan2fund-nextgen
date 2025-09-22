import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Dialog, DialogContent, DialogTrigger, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import ProgramDetailsModal from "@/components/reco/ProgramDetailsModal";
import ExplorationModal from "@/components/reco/ExplorationModal";
import InfoDrawer from "@/components/common/InfoDrawer";
import HealthFooter from "@/components/common/HealthFooter";
import { scoreProgramsEnhanced, EnhancedProgramResult } from "@/lib/enhancedRecoEngine";

// Enhanced program result type with detailed explanations
type ProgramResult = EnhancedProgramResult;

export default function ResultsPage() {
  const router = useRouter();
  const [results, setResults] = useState<ProgramResult[]>([]);
  const [showDebug, setShowDebug] = useState(false);
  const [showExploration, setShowExploration] = useState(false);
  const [showInfoDrawer, setShowInfoDrawer] = useState(false);
  const [selectedProgram, setSelectedProgram] = useState<ProgramResult | null>(null);
  const [_userAnswers, setUserAnswers] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem("recoResults");
    const answers = localStorage.getItem("userAnswers");

    try {
      if (stored) {
        const parsed = JSON.parse(stored);

        if (Array.isArray(parsed)) {
          // Convert old format to enhanced format
          const enhancedResults = parsed.map(program => ({
            ...program,
            matchedCriteria: [],
            gaps: [],
            amount: { min: 0, max: 0, currency: 'EUR' },
            timeline: 'Varies by program',
            successRate: 0.3,
            llmFailed: true,
            fallbackReason: program.reason,
            fallbackGaps: program.unmetRequirements || []
          }));
          setResults(enhancedResults);
        } else if (parsed.recommendations && Array.isArray(parsed.recommendations)) {
          const enhancedResults = parsed.recommendations.map((program: any) => ({
            ...program,
            matchedCriteria: [],
            gaps: [],
            amount: { min: 0, max: 0, currency: 'EUR' },
            timeline: 'Varies by program',
            successRate: 0.3,
            llmFailed: true,
            fallbackReason: program.reason,
            fallbackGaps: program.unmetRequirements || []
          }));
          setResults(enhancedResults);
        }
      }
      
      
      if (answers) {
        const parsedAnswers = JSON.parse(answers);
        setUserAnswers(parsedAnswers);
        // Get enhanced results using the wired engine
        const enhancedResults = scoreProgramsEnhanced(parsedAnswers, "strict");
        setResults(enhancedResults);
      }
    } catch (err) {
      console.error("Failed to parse results:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  const eligibleResults = results.filter(r => r.eligibility === "Eligible");
  const hasEligibleResults = eligibleResults.length > 0;
  const hasAnyResults = results.length > 0;


  if (loading) {
    return (
      <div className="p-6 max-w-4xl mx-auto">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading recommendations...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-semibold">
          Your Funding Recommendations
        </h2>
        <div className="flex items-center gap-4">
          <Link href="/dashboard" className="text-blue-600 hover:text-blue-800 text-sm">
            Dashboard
          </Link>
          <button
            onClick={() => setShowInfoDrawer(true)}
            className="text-blue-600 hover:text-blue-800 text-sm flex items-center gap-1"
          >
            <span>ℹ️</span> How recommendations work
          </button>
        </div>
      </div>

      {/* No-match fallback: Nearest 3 + Proceed anyway */}
      {hasAnyResults && !hasEligibleResults && (
        <div className="p-6 border border-orange-300 bg-orange-50 rounded-lg mb-6">
          <h3 className="text-lg font-semibold text-orange-800 mb-2">No Perfect Matches Found</h3>
          <p className="text-orange-700 mb-4">
            None of the programs match your current criteria exactly. Here are the closest matches:
          </p>
          
          {/* Nearest 3 programs */}
          <div className="mb-4">
            <h4 className="font-semibold text-orange-800 mb-2">Nearest 3 Programs:</h4>
            <div className="space-y-2">
              {results.slice(0, 3).map((program) => (
                <div key={program.id} className="p-3 bg-white border border-orange-200 rounded">
                  <div className="flex justify-between items-center">
                    <div>
                      <div className="font-medium">{program.name}</div>
                      <div className="text-sm text-gray-600">{program.type} • {program.score}% match</div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm text-orange-600">
                        {program.gaps && program.gaps.length > 0 ? 
                          `Missing: ${program.gaps[0].description}` : 
                          'Some requirements not met'
                        }
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* What to change */}
          <div className="mb-4">
            <h4 className="font-semibold text-orange-800 mb-2">What to change to qualify:</h4>
            <ul className="text-sm text-orange-700 space-y-1">
              {results.slice(0, 3).map((program, idx) => (
                <li key={idx} className="flex items-start">
                  <span className="text-orange-500 mr-2">•</span>
                  <strong>{program.name}:</strong> {program.gaps && program.gaps.length > 0 ? 
                    program.gaps[0].action : 'Review eligibility requirements'
                  }
                </li>
              ))}
            </ul>
          </div>

          {/* Action buttons */}
          <div className="flex gap-3">
            <Link href="/reco" className="px-4 py-2 bg-orange-600 text-white rounded hover:bg-orange-700">
              Adjust Answers
            </Link>
            <Button 
              onClick={() => {
                // Store user answers and selected program for editor
                const selectedProgram = results[0]; // Use first program as default
                
                // Derive signals and get top 3 programs
                const { deriveSignals } = require('@/lib/enhancedRecoEngine');
                const derivedSignals = deriveSignals(_userAnswers);
                const top3ProgramIds = results.slice(0, 3).map(p => p.id);
                
                // Create enhanced payload with all derived signals
                const enhancedPayload = {
                  programId: selectedProgram.id,
                  answers: _userAnswers,
                  fundingMode: derivedSignals.fundingMode,
                  trace: selectedProgram.trace,
                  top3ProgramIds: top3ProgramIds,
                  derivedSignals: derivedSignals,
                  // Include all derived signals for editor
                  unknowns: derivedSignals.unknowns,
                  counterfactuals: derivedSignals.counterfactuals,
                  // Additional derived signals
                  trlBucket: derivedSignals.trlBucket,
                  revenueBucket: derivedSignals.revenueBucket,
                  ipFlag: derivedSignals.ipFlag,
                  regulatoryFlag: derivedSignals.regulatoryFlag,
                  socialImpactFlag: derivedSignals.socialImpactFlag,
                  esgFlag: derivedSignals.esgFlag,
                  capexFlag: derivedSignals.capexFlag,
                  equityOk: derivedSignals.equityOk,
                  collateralOk: derivedSignals.collateralOk,
                  urgencyBucket: derivedSignals.urgencyBucket,
                  companyAgeBucket: derivedSignals.companyAgeBucket,
                  sectorBucket: derivedSignals.sectorBucket,
                  rdInAT: derivedSignals.rdInAT,
                  amountFit: derivedSignals.amountFit,
                  stageFit: derivedSignals.stageFit,
                  timelineFit: derivedSignals.timelineFit
                };
                
                localStorage.setItem('selectedProgram', JSON.stringify(selectedProgram));
                localStorage.setItem('userAnswers', JSON.stringify(_userAnswers));
                localStorage.setItem('enhancedPayload', JSON.stringify(enhancedPayload));
                
                router.push('/editor?programId=' + selectedProgram.id + '&answers=' + encodeURIComponent(JSON.stringify(_userAnswers)) + '&pf=' + encodeURIComponent(JSON.stringify(enhancedPayload)));
              }}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Proceed Anyway → Editor with Pre-filled Fields
            </Button>
          </div>
        </div>
      )}

      {/* No results */}
      {results.length === 0 && (
        <div className="p-4 border border-red-300 bg-red-50 rounded-lg text-center">
          <p className="text-red-700 mb-2 font-medium">
            No recommendations found. Please adjust your answers.
          </p>
          <Link href="/reco">
            <Button>Go Back</Button>
          </Link>
        </div>
      )}

      {/* Results list */}
      {results.length > 0 && (
        <div className="grid gap-4">
          {results.map((program) => (
            <Card key={program.id} className="p-4 shadow-md rounded-xl">
              <div className="flex justify-between items-center mb-3">
                <div>
                  <h3 className="text-lg font-bold">{program.name}</h3>
                  <span className="text-sm text-gray-600 capitalize">{program.type}</span>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-blue-600">{program.score}%</div>
                  <div className="text-xs text-gray-500">Match</div>
                </div>
              </div>

              {/* Why it fits - Program-specific benefits */}
              <div className="mb-4">
                <h4 className="text-sm font-semibold text-gray-800 mb-2">Why this program fits your project:</h4>
                <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                  <ul className="text-sm text-gray-700 space-y-2">
                    {program.founderFriendlyReasons && program.founderFriendlyReasons.length > 0 ? (
                      program.founderFriendlyReasons.slice(0, 3).map((reason, idx) => (
                        <li key={idx} className="flex items-start">
                          <span className="text-green-500 mr-2 mt-0.5">✓</span>
                          <span>{reason}</span>
                        </li>
                      ))
                    ) : (
                      <li className="flex items-start">
                        <span className="text-green-500 mr-2 mt-0.5">✓</span>
                        <span>This program aligns with your project stage and funding needs</span>
                      </li>
                    )}
                  </ul>
                </div>
              </div>

              {/* Key Requirements */}
              {program.trace && (
                <div className="mb-3">
                  <h4 className="text-sm font-semibold text-gray-800 mb-2">Key Requirements:</h4>
                  
                  {/* Passed criteria */}
                  {program.trace.passed && program.trace.passed.length > 0 && (
                    <div className="mb-2">
                      <div className="text-xs font-medium text-green-700 mb-1">✅ You meet:</div>
                      <ul className="text-xs text-green-600 space-y-1">
                        {program.trace.passed.slice(0, 2).map((item, idx) => (
                          <li key={idx} className="flex items-start">
                            <span className="text-green-500 mr-2">✓</span>
                            {item.replace(/answers\.(q\d+_\w+)\s+matches\s+requirement\s+\(([^)]+)\)/, '$2')}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Failed criteria */}
                  {program.trace.failed && program.trace.failed.length > 0 && (
                    <div className="mb-2">
                      <div className="text-xs font-medium text-red-700 mb-1">❌ Missing:</div>
                      <ul className="text-xs text-red-600 space-y-1">
                        {program.trace.failed.slice(0, 1).map((item, idx) => (
                          <li key={idx} className="flex items-start">
                            <span className="text-red-500 mr-2">✗</span>
                            {item.replace(/answers\.(q\d+_\w+)\s+does\s+not\s+match\s+requirement\s+\(([^)]+)\)/, '$2')}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Suggestions */}
                  {program.trace.counterfactuals && program.trace.counterfactuals.length > 0 && (
                    <div className="mb-2">
                      <div className="text-xs font-medium text-blue-700 mb-1">💡 To improve eligibility:</div>
                      <ul className="text-xs text-blue-600 space-y-1">
                        {program.trace.counterfactuals.slice(0, 2).map((item, idx) => (
                          <li key={idx} className="flex items-start">
                            <span className="text-blue-500 mr-2">→</span>
                            {item}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}

              {/* Risks/Next steps - 1 bullet */}
              <div className="mb-3">
                <h4 className="text-sm font-semibold text-gray-800 mb-2">Risks/Next steps:</h4>
                <ul className="text-sm text-gray-700 space-y-1">
                  {program.founderFriendlyRisks && program.founderFriendlyRisks.length > 0 ? (
                    program.founderFriendlyRisks.slice(0, 1).map((risk, idx) => (
                      <li key={idx} className="flex items-start">
                        <span className="text-yellow-500 mr-2">•</span>
                        {risk}
                      </li>
                    ))
                  ) : (
                    <li className="flex items-start">
                      <span className="text-yellow-500 mr-2">•</span>
                      Verify all eligibility requirements before applying
                    </li>
                  )}
                </ul>
              </div>
              {program.unmetRequirements && program.unmetRequirements.some(r => r.includes("missing")) && (
                <p className="text-xs text-yellow-700 mt-1">?? Some requirements unknown due to skipped answers (Explorer mode)</p>
              )}


              {/* Unmet requirements */}
              {program.unmetRequirements && program.unmetRequirements.length > 0 && (
                <ul className="text-xs text-red-600 list-disc ml-5 mb-2">
                  {program.unmetRequirements.map((req, idx) => (
                    <li key={idx}>{req}</li>
                  ))}
                </ul>
              )}

              <div className="flex gap-2 items-center mb-2">
                <span className="px-2 py-1 text-xs rounded bg-blue-100 text-blue-800">
                  {program.score}% Match
                </span>
                <span className="px-2 py-1 text-xs rounded bg-purple-100 text-purple-800">
                  {program.type}
                </span>
                {program.confidence && (
                  <span
                    className={`px-2 py-1 text-xs rounded ${
                      program.confidence === "High"
                        ? "bg-green-200 text-green-800"
                        : program.confidence === "Medium"
                        ? "bg-yellow-200 text-yellow-800"
                        : "bg-red-200 text-red-800"
                    }`}
                  >
                    Confidence: {program.confidence}
                  </span>
                )}
                <span className={`px-2 py-1 text-xs rounded ${program.eligibility === 'Eligible' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                  {program.eligibility}
                </span>
                <span className={`px-2 py-1 text-xs rounded ${
                  program.confidence === "High" ? "bg-green-200 text-green-800" : 
                  program.confidence === "Medium" ? "bg-yellow-200 text-yellow-800" : 
                  "bg-red-200 text-red-800"
                }`}>
                  {program.confidence} Confidence
                </span>
              </div>

              {program.source && (
                <a
                  href={program.source}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 underline text-sm"
                >
                  Official source →
                </a>
              )}
              <button
                onClick={() => {
                  const note = prompt("Report a mismatch or issue with this program:");
                  if (note) {
                    try {
                      const reports = JSON.parse(localStorage.getItem("programReports") || "[]");
                      reports.push({ programId: program.id, note, timestamp: new Date().toISOString() });
                      localStorage.setItem("programReports", JSON.stringify(reports));
                      alert("Report saved locally. Thank you!");
                    } catch (e) {
                      console.error("Failed to save report:", e);
                    }
                  }
                }}
                className="ml-2 text-xs text-gray-500 hover:text-gray-700 underline"
              >
                Report mismatch
              </button>



              <div className="mt-4 flex gap-2">
                <Dialog>
                  <DialogTrigger asChild>
                    <Button className="flex-1" disabled={!hasEligibleResults}>Continue to Plan</Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Use this recommendation?</DialogTitle>
                      <DialogDescription>
                        We'll prefill your plan with relevant hints based on this program.
                      </DialogDescription>
                    </DialogHeader>
                    <Button 
                      className="w-full mt-3"
                      onClick={() => {
                        // Derive signals and get top 3 programs
                        const { deriveSignals } = require('@/lib/enhancedRecoEngine');
                        const derivedSignals = deriveSignals(_userAnswers);
                        const top3ProgramIds = results.slice(0, 3).map(p => p.id);
                        
                        // Create enhanced payload
                        const enhancedPayload = {
                          programId: program.id,
                          answers: _userAnswers,
                          fundingMode: derivedSignals.fundingMode,
                          trace: program.trace,
                          top3ProgramIds: top3ProgramIds,
                          derivedSignals: derivedSignals
                        };
                        
                        localStorage.setItem('selectedProgram', JSON.stringify(program));
                        localStorage.setItem('userAnswers', JSON.stringify(_userAnswers));
                        localStorage.setItem('enhancedPayload', JSON.stringify(enhancedPayload));
                        
                        router.push('/editor?programId=' + program.id + '&answers=' + encodeURIComponent(JSON.stringify(_userAnswers)) + '&pf=' + encodeURIComponent(JSON.stringify(enhancedPayload)));
                      }}
                    >
                      Prefill and continue →
                    </Button>
                  </DialogContent>
                </Dialog>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setSelectedProgram(program)}
                >
                  Details
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}


      {/* Add Custom Program */}
      <div className="mt-6 text-center">
        <button
          onClick={() => setShowExploration(true)}
          className="text-blue-600 hover:text-blue-800 text-sm flex items-center gap-1 mx-auto"
        >
          <span>+</span> Add a known program
        </button>
        <div className="text-xs text-gray-500 mt-1">
          Exploration Mode lets you try a program we don't track yet. Results are demo-only, not official.
        </div>
      </div>

      {/* Modals */}
      <ProgramDetailsModal
        isOpen={!!selectedProgram}
        onClose={() => setSelectedProgram(null)}
        program={selectedProgram}
      />

      <ExplorationModal
        isOpen={showExploration}
        onClose={() => setShowExploration(false)}
        onAddProgram={(customProgram) => {
          setResults(prev => [customProgram, ...prev]);
        }}
      />

      <InfoDrawer
        isOpen={showInfoDrawer}
        onClose={() => setShowInfoDrawer(false)}
        title="How Recommendations Work"
        content={
          <div className="space-y-4">
            <p>
              Our recommendation engine combines your survey answers and free-text "signal chips" 
              to find the best funding matches for your situation.
            </p>
            
            <h3 className="font-semibold">How We Score Programs:</h3>
            <ul className="list-disc list-inside space-y-1">
              <li><strong>HARD rules</strong> act as filters - if you don't meet them, the program is marked as "Not eligible"</li>
              <li><strong>SOFT rules</strong> influence the "fit" score - more matches mean higher fit percentage</li>
              <li><strong>Effort</strong> reflects how complex the application process is (1=easy, 5=complex)</li>
              <li><strong>Readiness</strong> considers what documents you have vs. what's required</li>
              <li><strong>Confidence</strong> reflects data freshness and how well we understand your situation</li>
            </ul>

            <h3 className="font-semibold">Improving Our Recommendations:</h3>
            <ul className="list-disc list-inside space-y-1">
              <li>Click "Official source" links to verify program details</li>
              <li>Use "Report mismatch" if you find incorrect information</li>
              <li>Try "Exploration Mode" to test programs we don't track yet</li>
            </ul>

            <div className="p-3 bg-blue-50 rounded text-sm">
              <strong>Note:</strong> All recommendations are based on publicly available information 
              and should be verified with official sources before applying.
            </div>
          </div>
        }
      />
      
      <HealthFooter />
    </div>
  );
}
