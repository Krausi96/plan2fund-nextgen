import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Dialog, DialogContent, DialogTrigger, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import ProgramDetailsModal from "@/components/reco/ProgramDetailsModal";
import ExplorationModal from "@/components/reco/ExplorationModal";
import InfoDrawer from "@/components/common/InfoDrawer";
import HealthFooter from "@/components/common/HealthFooter";
import { scoreProgramsEnhanced, analyzeFreeTextEnhanced, EnhancedProgramResult } from "@/lib/simpleRecoEngine";

// Enhanced program result type with detailed explanations
type ProgramResult = EnhancedProgramResult;

export default function ResultsPage() {
  const [results, setResults] = useState<ProgramResult[]>([]);
  const [freeText, setFreeText] = useState<string | null>(null);
  const [showDebug, setShowDebug] = useState(false);
  const [showExploration, setShowExploration] = useState(false);
  const [showInfoDrawer, setShowInfoDrawer] = useState(false);
  const [selectedProgram, setSelectedProgram] = useState<ProgramResult | null>(null);
  const [_userAnswers, setUserAnswers] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem("recoResults");
    const freeTextReco = localStorage.getItem("freeTextReco");
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
      
      if (freeTextReco) {
        setFreeText(freeTextReco);
        // Analyze free text and get enhanced results
        const { scored } = analyzeFreeTextEnhanced(freeTextReco);
        setResults(scored);
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
              {results.slice(0, 3).map((program, idx) => (
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
            <Link href="/plan?mode=qbank" className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
              Proceed Anyway → Editor with QBank
            </Link>
          </div>
        </div>
      )}

      {/* Free text fallback */}
      {freeText && results.length === 0 && (
        <div className="p-4 border border-blue-300 bg-blue-50 rounded-lg text-center">
          <p className="text-blue-800 mb-2">
            You entered a free-text description. Our AI will analyze this in future updates.
          </p>
          <p className="italic text-sm">{freeText}</p>
          <Link href="/reco">
            <Button className="mt-4">Go Back</Button>
          </Link>
        </div>
      )}

      {/* No results */}
      {!freeText && results.length === 0 && (
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

              {/* Why it fits - 3-5 plain-language bullets */}
              <div className="mb-3">
                <h4 className="text-sm font-semibold text-gray-800 mb-2">Why it fits:</h4>
                <ul className="text-sm text-gray-700 space-y-1">
                  {program.matchedCriteria && program.matchedCriteria.length > 0 ? (
                    program.matchedCriteria.slice(0, 3).map((criteria, idx) => (
                      <li key={idx} className="flex items-start">
                        <span className="text-green-500 mr-2">•</span>
                        {criteria.reason}
                      </li>
                    ))
                  ) : (
                    <li className="flex items-start">
                      <span className="text-green-500 mr-2">•</span>
                      {program.reason || 'General program match'}
                    </li>
                  )}
                </ul>
              </div>

              {/* Risks/Next steps - 1-2 bullets */}
              <div className="mb-3">
                <h4 className="text-sm font-semibold text-gray-800 mb-2">Risks/Next steps:</h4>
                <ul className="text-sm text-gray-700 space-y-1">
                  {program.gaps && program.gaps.length > 0 ? (
                    program.gaps.slice(0, 2).map((gap, idx) => (
                      <li key={idx} className="flex items-start">
                        <span className="text-yellow-500 mr-2">•</span>
                        {gap.description}
                      </li>
                    ))
                  ) : (
                    <li className="flex items-start">
                      <span className="text-yellow-500 mr-2">•</span>
                      Verify eligibility requirements before applying
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

              {program.scores && (
                <div className="text-xs text-gray-500 mb-2">
                  Fit {program.scores.fit}% · Readiness {program.scores.readiness}% · Effort {program.scores.effort}% · Confidence {program.scores.confidence}%
                </div>
              )}

              {/* Why panel */}
              {program.why && program.why.length > 0 && (
                <details className="text-sm bg-gray-50 rounded p-3 mb-3">
                  <summary className="cursor-pointer">Why this ranked here</summary>
                  <ul className="list-disc list-inside mt-2 text-gray-700">
                    {program.why.map((w, i) => (
                      <li key={i}>{w}</li>
                    ))}
                  </ul>
                </details>
              )}

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
                    <Link href={`/plan?programId=${program.id}`}>
                      <Button className="w-full mt-3">Prefill and continue →</Button>
                    </Link>
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

      {/* Debug Panel */}
      {hasAnyResults && (
        <div className="mt-8">
          <button
            onClick={() => setShowDebug(!showDebug)}
            className="text-sm text-gray-600 hover:text-gray-800 flex items-center gap-1"
          >
            <span>{showDebug ? "▼" : "▶"}</span> Debug Information
          </button>
          {showDebug && (
            <div className="mt-2 p-4 bg-gray-50 rounded text-sm">
              <h4 className="font-semibold mb-2">Scoring Breakdown</h4>
              {results.slice(0, 3).map((r, i) => (
                <div key={i} className="mb-3 p-2 bg-white rounded">
                  <div className="font-medium">{r.name}</div>
                  <div className="text-xs text-gray-600">
                    <div>Eligibility: {r.eligibility}</div>
                    <div>Confidence: {r.confidence}</div>
                    {r.scores && (
                      <div>Fit: {r.scores.fit}% | Readiness: {r.scores.readiness}% | Effort: {r.scores.effort}% | Confidence: {r.scores.confidence}%</div>
                    )}
                    {r.why && (
                      <div className="mt-1">
                        <div className="font-medium">Analysis:</div>
                        <ul className="list-disc list-inside ml-2">
                          {r.why.slice(0, 3).map((w, j) => (
                            <li key={j}>{w}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
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
