import { useState } from "react";
import { useRouter } from "next/router";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Dialog, DialogContent, DialogTrigger, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import ProgramDetailsModal from "@/components/reco/ProgramDetailsModal";
// import ExplorationModal from "@/components/reco/ExplorationModal"; // Removed - results managed by context
import InfoDrawer from "@/components/common/InfoDrawer";
import { useRecommendation } from "@/contexts/RecommendationContext";
import { useI18n } from "@/contexts/I18nContext";
import StructuredRequirementsDisplay from "@/components/results/StructuredRequirementsDisplay";

// Enhanced program result type with detailed explanations
type ProgramResult = any; // Using any for now to avoid import issues

export default function ResultsPage() {
  const { t } = useI18n();
  const router = useRouter();
  const { state } = useRecommendation();
  // const [showExploration, setShowExploration] = useState(false); // Removed - results managed by context
  const [showInfoDrawer, setShowInfoDrawer] = useState(false);
  const [selectedProgram, setSelectedProgram] = useState<ProgramResult | null>(null);
  
  // Use results from context instead of local state
  const results = state.recommendations;
  const loading = state.isLoading;
  // const userAnswers = state.answers;

  // Results are now managed by the RecommendationContext
  // No need for localStorage loading here

  const eligibleResults = results.filter(r => r.eligibility === t("results.eligible"));
  const hasEligibleResults = eligibleResults.length > 0;
  const hasAnyResults = results.length > 0;


  if (loading) {
    return (
      <div className="p-6 max-w-4xl mx-auto">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">{t('results.loading')}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-50 via-white to-emerald-50">
      <div className="max-w-4xl mx-auto px-6 py-2">
        <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-8 mb-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-semibold text-gray-900">
              {t('results.title')}
            </h2>
            <div className="flex items-center gap-4">
              <Link href="/dashboard" className="text-blue-600 hover:text-blue-800 text-sm font-medium">
                {t('results.dashboard')}
              </Link>
              <button
                onClick={() => setShowInfoDrawer(true)}
                className="text-blue-600 hover:text-blue-800 text-sm flex items-center gap-1 font-medium"
              >
                <span>ℹ️</span> {t('results.howItWorks')}
              </button>
            </div>
          </div>
        </div>

        {/* No-match fallback: Nearest 3 + Proceed anyway */}
        {hasAnyResults && !hasEligibleResults && (
          <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-8 mb-6">
            <div className="p-6 border border-orange-300 bg-orange-50 rounded-xl">
              <h3 className="text-lg font-semibold text-orange-800 mb-2">{t('results.noMatches.title')}</h3>
              <p className="text-orange-700 mb-4">
                {t('results.noMatches.description')}
              </p>
          
          {/* Nearest 3 programs */}
          <div className="mb-4">
            <h4 className="font-semibold text-orange-800 mb-2">{t('results.noMatches.nearest3')}</h4>
            <div className="space-y-2">
              {results.slice(0, 3).map((program) => (
                <div key={program.id} className="p-3 bg-white border border-orange-200 rounded">
                  <div className="flex justify-between items-center">
                    <div>
                      <div className="font-medium">{program.name}</div>
                      <div className="text-sm text-gray-600">{program.type} • {program.score}% {t('results.noMatches.match')}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm text-orange-600">
                        {program.gaps && program.gaps.length > 0 ? 
                          `${t('results.noMatches.missing')} ${program.gaps[0].description}` : 
                          t('results.noMatches.someRequirements')
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
            <h4 className="font-semibold text-orange-800 mb-2">{t('results.noMatches.whatToChange')}</h4>
            <ul className="text-sm text-orange-700 space-y-1">
              {results.slice(0, 3).map((program, idx) => (
                <li key={idx} className="flex items-start">
                  <span className="text-orange-500 mr-2">•</span>
                  <strong>{program.name}:</strong> {program.gaps && program.gaps.length > 0 ? 
                    program.gaps[0].action : t('results.noMatches.reviewRequirements')
                  }
                </li>
              ))}
            </ul>
          </div>

          {/* Action buttons */}
          <div className="flex gap-3">
            <Link href="/reco" className="px-4 py-2 bg-orange-600 text-white rounded hover:bg-orange-700">
              {t('results.noMatches.adjustAnswers')}
            </Link>
            <Button 
              onClick={() => {
                // Store user answers and selected program for editor
                const selectedProgram = results[0]; // Use first program as default
                
                // Derive signals and get top 3 programs
                const { deriveSignals } = require('@/lib/enhancedRecoEngine');
                const derivedSignals = deriveSignals(state.answers);
                const top3ProgramIds = results.slice(0, 3).map(p => p.id);
                
                // Create enhanced payload with all derived signals
                const enhancedPayload = {
                  programId: selectedProgram.id,
                  answers: state.answers,
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
                localStorage.setItem('userAnswers', JSON.stringify(state.answers));
                localStorage.setItem('enhancedPayload', JSON.stringify(enhancedPayload));
                
                // Extract route from program type and set product
                const route = selectedProgram.type?.toLowerCase() || 'grant';
                const product = 'submission'; // Default to submission-ready business plan
                
                router.push(`/editor?programId=${selectedProgram.id}&route=${route}&product=${product}&answers=${encodeURIComponent(JSON.stringify(state.answers))}&pf=${encodeURIComponent(JSON.stringify(enhancedPayload))}`);
              }}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              {t('results.noMatches.proceedAnyway')}
            </Button>
          </div>
        </div>
      )}

      {/* No results */}
      {results.length === 0 && (
        <div className="p-4 border border-red-300 bg-red-50 rounded-lg text-center">
          <p className="text-red-700 mb-2 font-medium">
            {t('results.noResults.title')}
          </p>
          <Link href="/reco">
            <Button>{t('results.noResults.goBack')}</Button>
          </Link>
        </div>
      )}

        {/* Results list */}
        {results.length > 0 && (
          <div className="space-y-6">
            {results.map((program) => (
              <div key={program.id} className="bg-white rounded-2xl shadow-lg border border-gray-200 p-8">
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
                <h4 className="text-sm font-semibold text-gray-800 mb-2">{t('results.whyFits')}</h4>
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
                        <span>{t('results.alignsWithProject')}</span>
                      </li>
                    )}
                  </ul>
                </div>
              </div>

              {/* Structured Requirements */}
              <StructuredRequirementsDisplay programId={program.id} />

              {/* Key Requirements */}
              {program.trace && (
                <div className="mb-3">
                  <h4 className="text-sm font-semibold text-gray-800 mb-2">{t('results.keyRequirements')}</h4>
                  
                  {/* Passed criteria */}
                  {program.trace.passed && program.trace.passed.length > 0 && (
                    <div className="mb-2">
                      <div className="text-xs font-medium text-green-700 mb-1">{t('results.youMeet')}</div>
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
                      <div className="text-xs font-medium text-red-700 mb-1">{t('results.missing')}</div>
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
                      <div className="text-xs font-medium text-blue-700 mb-1">{t('results.toImproveEligibility')}</div>
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
                <h4 className="text-sm font-semibold text-gray-800 mb-2">{t('results.risksNextSteps')}</h4>
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
                      {t('results.verifyRequirements')}
                    </li>
                  )}
                </ul>
              </div>
              {program.unmetRequirements && program.unmetRequirements.some(r => r.includes("missing")) && (
                <p className="text-xs text-yellow-700 mt-1">{t('results.requirementsUnknown')}</p>
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
                  {program.score}% {t('results.match')}
                </span>
                <span className="px-2 py-1 text-xs rounded bg-purple-100 text-purple-800">
                  {program.type}
                </span>
                {program.confidence && (
                  <span
                    className={`px-2 py-1 text-xs rounded ${
                      program.confidence === t("results.confidenceHigh")
                        ? "bg-green-200 text-green-800"
                        : program.confidence === t("results.confidenceMedium")
                        ? "bg-yellow-200 text-yellow-800"
                        : "bg-red-200 text-red-800"
                    }`}
                  >
                    {t('results.confidence')} {program.confidence}
                  </span>
                )}
                <span className={`px-2 py-1 text-xs rounded ${program.eligibility === 'Eligible' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                  {program.eligibility}
                </span>
                <span className={`px-2 py-1 text-xs rounded ${
                  program.confidence === t("results.confidenceHigh") ? "bg-green-200 text-green-800" : 
                  program.confidence === t("results.confidenceMedium") ? "bg-yellow-200 text-yellow-800" : 
                  "bg-red-200 text-red-800"
                }`}>
                  {program.confidence} {t('results.confidence')}
                </span>
              </div>

              {program.source && (
                <a
                  href={program.source}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 underline text-sm"
                >
                  {t('results.officialSource')}
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
                {t('results.reportMismatch')}
              </button>



              <div className="mt-4 flex gap-2">
                <Dialog>
                  <DialogTrigger asChild>
                    <Button className="flex-1" disabled={!hasEligibleResults}>{t('results.continueToPlan')}</Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>{t('results.useRecommendation')}</DialogTitle>
                      <DialogDescription>
                        {t('results.prefillDescription')}
                      </DialogDescription>
                    </DialogHeader>
                    <Button 
                      className="w-full mt-3"
                      onClick={() => {
                        // Derive signals and get top 3 programs
                        const { deriveSignals } = require('@/lib/enhancedRecoEngine');
                        const derivedSignals = deriveSignals(state.answers);
                        const top3ProgramIds = results.slice(0, 3).map(p => p.id);
                        
                        // Create enhanced payload
                        const enhancedPayload = {
                          programId: program.id,
                          answers: state.answers,
                          fundingMode: derivedSignals.fundingMode,
                          trace: program.trace,
                          top3ProgramIds: top3ProgramIds,
                          derivedSignals: derivedSignals
                        };
                        
                        localStorage.setItem('selectedProgram', JSON.stringify(program));
                        localStorage.setItem('userAnswers', JSON.stringify(state.answers));
                        localStorage.setItem('enhancedPayload', JSON.stringify(enhancedPayload));
                        
                        // Extract route from program type and set product
                        const route = program.type?.toLowerCase() || 'grant';
                        const product = 'submission'; // Default to submission-ready business plan
                        
                        router.push(`/editor?programId=${program.id}&route=${route}&product=${product}&answers=${encodeURIComponent(JSON.stringify(state.answers))}&pf=${encodeURIComponent(JSON.stringify(enhancedPayload))}`);
                      }}
                    >
                      {t('results.prefillContinue')}
                    </Button>
                  </DialogContent>
                </Dialog>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setSelectedProgram(program)}
                >
                  {t('results.details')}
                </Button>
              </div>
              </div>
            ))}
          </div>
        )}


      {/* Add Custom Program - removed, results managed by context */}

      {/* Modals */}
      <ProgramDetailsModal
        isOpen={!!selectedProgram}
        onClose={() => setSelectedProgram(null)}
        program={selectedProgram}
      />

      {/* ExplorationModal removed - results now managed by context */}

      <InfoDrawer
        isOpen={showInfoDrawer}
        onClose={() => setShowInfoDrawer(false)}
        title={t('results.howItWorksTitle')}
        content={
          <div className="space-y-4">
            <p>
              {t('results.howItWorksDescription')}
            </p>
            
            <h3 className="font-semibold">{t('results.howWeScore')}</h3>
            <ul className="list-disc list-inside space-y-1">
              <li><strong>{t('results.hardRules')}</strong></li>
              <li><strong>{t('results.softRules')}</strong></li>
              <li><strong>{t('results.effort')}</strong></li>
              <li><strong>{t('results.readiness')}</strong></li>
              <li><strong>{t('results.confidenceDesc')}</strong></li>
            </ul>

            <h3 className="font-semibold">{t('results.improvingRecommendations')}</h3>
            <ul className="list-disc list-inside space-y-1">
              <li>{t('results.verifyProgramDetails')}</li>
              <li>{t('results.reportMismatchDesc')}</li>
              <li>{t('results.tryExplorationMode')}</li>
            </ul>

            <div className="p-3 bg-blue-50 rounded text-sm">
              <strong>{t('results.note')}</strong> {t('results.disclaimer')}
            </div>
          </div>
        }
      />
      
      </div>
    </div>
  );
}
