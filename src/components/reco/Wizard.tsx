import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/router";
import { motion, AnimatePresence } from "framer-motion";
import { ClientRecoEngine } from "@/lib/clientRecoEngine";

type PersonaMode = "strict" | "explorer";

export default function Wizard() {
  const router = useRouter();
  const [mode, setMode] = useState<"survey" | "freeText">("survey");
  const [personaMode, setPersonaMode] = useState<PersonaMode>("strict");
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [microQuestions, setMicroQuestions] = useState<any[]>([]);
  const [showMicroQuestions, setShowMicroQuestions] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [questionsData, setQuestionsData] = useState<any>(null);
  const [programsData, setProgramsData] = useState<any[]>([]);

  useEffect(() => {
    setMounted(true);
    // Load data dynamically
    loadData();
  }, []);

  const loadData = async () => {
    try {
      console.log('Starting data load...');
      
      const [questionsResponse, programsResponse] = await Promise.all([
        fetch('/questions.json', { 
          cache: 'no-cache',
          headers: { 'Content-Type': 'application/json' }
        }).then(async res => {
          console.log('Questions fetch status:', res.status);
          if (!res.ok) throw new Error(`Questions fetch failed: ${res.status}`);
          const text = await res.text();
          console.log('Questions response text:', text.substring(0, 100));
          return JSON.parse(text);
        }),
        fetch('/programs.json', { 
          cache: 'no-cache',
          headers: { 'Content-Type': 'application/json' }
        }).then(async res => {
          console.log('Programs fetch status:', res.status);
          if (!res.ok) throw new Error(`Programs fetch failed: ${res.status}`);
          const text = await res.text();
          console.log('Programs response text:', text.substring(0, 100));
          return JSON.parse(text);
        })
      ]);
      
      console.log('Successfully loaded questions:', questionsResponse);
      console.log('Successfully loaded programs:', programsResponse);
      
      setQuestionsData(questionsResponse);
      setProgramsData(programsResponse.programs || []);
    } catch (error) {
      console.error('Error loading data:', error);
      console.log('Using fallback data...');
      
      // Fallback to empty data with proper structure
      setQuestionsData({ 
        universal: [], 
        core: [], 
        micro: [] 
      });
      setProgramsData([]);
    }
  };

  // Micro-question engine: compute coverage gaps
  const computeMicroQuestions = (currentAnswers: Record<string, any>) => {
    const programs = programsData || [];
    
    const coverageGaps: string[] = [];
    const microQuestions: any[] = [];
    
    // Use structured questions from questions.json
    const coreQuestions = questionsData?.universal || questionsData?.core || [];
    const microQuestionsData = questionsData?.micro || [];
    
    // Check for missing critical attributes from core questions
    coreQuestions.forEach((q: any) => {
      if (q.required && !currentAnswers[q.id]) {
        coverageGaps.push(q.id);
        microQuestions.push(q);
      }
    });
    
    // Add micro-questions that would improve coverage
    microQuestionsData.forEach((mq: any) => {
      if (!currentAnswers[mq.id] && 
          programs.some((p: any) => p.tags?.some((tag: string) => mq.affects.includes(tag)))) {
        microQuestions.push(mq);
      }
    });
    
    // Legacy fallback for employee_count
    if (!currentAnswers.employee_count && !currentAnswers.headcount) {
      coverageGaps.push("employee_count");
      microQuestions.push({
        id: "employee_count",
        label: "How many employees do you have?",
        type: "select", 
        options: ["1-5", "6-10", "11-50", "51-250", "250+"]
      });
    }
    
    return { coverageGaps, microQuestions };
  };

  const handleNext = async () => {
    if (mode === "survey") {
      const currentQuestions = showMicroQuestions ? microQuestions : (questionsData?.universal || questionsData?.core || []);
      if (step < currentQuestions.length - 1) {
        setStep(step + 1);
      } else if (!showMicroQuestions) {
        // After main questions, check for micro-questions
        const { microQuestions: newMicroQuestions } = computeMicroQuestions(answers);
        if (newMicroQuestions.length > 0) {
          setMicroQuestions(newMicroQuestions);
          setShowMicroQuestions(true);
          setStep(0); // Reset step for micro-questions
        } else {
          await submitAnswers();
        }
      } else {
        // Micro-questions complete
        await submitAnswers();
      }
    } else {
      await submitFreeText();
    }
  };

  const submitAnswers = async () => {
    try {
      setLoading(true);
      const data = await ClientRecoEngine.processRecommendation(answers, personaMode, true);

      localStorage.setItem("recoResults", JSON.stringify(data.recommendations));
      localStorage.setItem("normalizedAnswers", JSON.stringify(data.normalizedAnswers));
      router.push("/results");
    } catch (err) {
      console.error("Error submitting answers:", err);
    } finally {
      setLoading(false);
    }
  };

  const submitFreeText = async () => {
    try {
      setLoading(true);
      const data = await ClientRecoEngine.processFreeText(answers.freeText || "");

      localStorage.setItem("recoResults", JSON.stringify(data.recommendations));
      localStorage.setItem("normalizedAnswers", JSON.stringify(data.normalizedAnswers));
      router.push("/results");
    } catch (err) {
      console.error("Error submitting free-text:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (key: string, value: any) => {
    setAnswers((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  if (!mounted) {
    return <div>Loading...</div>;
  }

  if (!questionsData) {
    return (
      <div className="p-6 max-w-5xl mx-auto">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-4">Loading Questions...</h2>
          <p className="text-gray-600">Please wait while we load the questionnaire.</p>
        </div>
      </div>
    );
  }

  const currentQuestions = showMicroQuestions ? microQuestions : (questionsData?.universal || questionsData?.core || []);
  const progressPercent = currentQuestions.length > 0 ? Math.round(((step + 1) / currentQuestions.length) * 100) : 0;

  // Safety check for current question
  if (step >= currentQuestions.length || !currentQuestions[step]) {
    return (
      <div className="p-6 max-w-5xl mx-auto">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-4">No Questions Available</h2>
          <p className="text-gray-600">There are no questions to display at this time.</p>
          <button 
            onClick={() => window.location.reload()} 
            className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Reload Page
          </button>
        </div>
      </div>
    );
  }

  // Extract signal chips from free text
  const extractChips = (text: string): string[] => {
    const chips: string[] = [];
    const lowerText = text.toLowerCase();
    
    // Location signals
    if (lowerText.includes("vienna")) chips.push("Location: Vienna");
    if (lowerText.includes("austria")) chips.push("Country: Austria");
    if (lowerText.includes("germany")) chips.push("Country: Germany");
    
    // Sector signals
    if (lowerText.includes("bakery") || lowerText.includes("food")) chips.push("Sector: Food");
    if (lowerText.includes("tech") || lowerText.includes("software")) chips.push("Sector: Technology");
    if (lowerText.includes("creative") || lowerText.includes("design")) chips.push("Sector: Creative");
    
    // Stage signals
    if (lowerText.includes("startup") || lowerText.includes("new")) chips.push("Stage: Startup");
    if (lowerText.includes("expand") || lowerText.includes("growth")) chips.push("Stage: Growth");
    
    // Funding type signals
    if (lowerText.includes("loan")) chips.push("Funding: Loan");
    if (lowerText.includes("grant")) chips.push("Funding: Grant");
    if (lowerText.includes("investment")) chips.push("Funding: Investment");
    
    // TRL signals
    if (lowerText.includes("prototype") || lowerText.includes("proof")) chips.push("TRL: 3-4");
    if (lowerText.includes("market") || lowerText.includes("commercial")) chips.push("TRL: 7-9");
    
    return chips;
  };

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <h2 className="text-xl font-semibold mb-4">Funding Recommendation Wizard</h2>

      {/* Local Stepper */}
      {mode === "survey" && (
        <div className="w-full bg-gray-50 border rounded mb-4 p-2 text-sm">
          <div className="flex justify-between">
            <span>
              {showMicroQuestions ? "Follow-up" : "Step"} {step + 1} of {currentQuestions.length}
              {showMicroQuestions && " (Micro-questions)"}
            </span>
            <span>{progressPercent}%</span>
          </div>
          <div className="w-full bg-gray-200 h-2 rounded mt-2">
            <div className="bg-blue-500 h-2 rounded" style={{ width: `${progressPercent}%` }} />
          </div>
        </div>
      )}

      {/* Persona Mode Toggle */}
      <div className="flex gap-2 mb-6">
        <Button
          variant={personaMode === "strict" ? "default" : "outline"}
          onClick={() => setPersonaMode("strict")}
        >
          Strict Mode
        </Button>
        <Button
          variant={personaMode === "explorer" ? "default" : "outline"}
          onClick={() => setPersonaMode("explorer")}
        >
          Explorer Mode
        </Button>
      </div>

      {/* Mode Toggle */}
      <div className="flex gap-2 mb-6">
        <Button
          variant={mode === "survey" ? "default" : "outline"}
          onClick={() => setMode("survey")}
        >
          Structured Survey
        </Button>
        <Button
          variant={mode === "freeText" ? "default" : "outline"}
          onClick={() => setMode("freeText")}
        >
          Free Text
        </Button>
      </div>

      {/* Progress Bar */}
      {mode === "survey" && (
        <div className="w-full bg-gray-200 h-2 rounded mb-6">
          <div
            className="bg-blue-500 h-2 rounded transition-all duration-300"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      )}

      {mode === "survey" ? (
        <div>
          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -50 }}
              transition={{ duration: 0.3 }}
              className="mb-4"
            >
              <label className="block text-sm font-medium mb-2">
                {currentQuestions[step]?.label || 'Question'}
              </label>
              {(currentQuestions[step]?.type === "select" || currentQuestions[step]?.type === "single-select") && (
                <select
                  value={answers[currentQuestions[step]?.id] || ""}
                  onChange={(e) => handleChange(currentQuestions[step]?.id, e.target.value)}
                  className="w-full border rounded p-2"
                >
                  <option value="">Select...</option>
                  {currentQuestions[step]?.options?.map((opt: any) => (
                    <option key={opt.value || opt} value={opt.value || opt}>
                      {opt.label || opt}
                    </option>
                  ))}
                </select>
              )}
              {currentQuestions[step]?.type === "number" && (
                <input
                  type="number"
                  value={answers[currentQuestions[step]?.id] || ""}
                  onChange={(e) => handleChange(currentQuestions[step]?.id, Number(e.target.value))}
                  className="w-full border rounded p-2"
                />
              )}
              {currentQuestions[step]?.type === "boolean" && (
                <select
                  value={answers[currentQuestions[step]?.id] || ""}
                  onChange={(e) => handleChange(currentQuestions[step]?.id, e.target.value === "Yes")}
                  className="w-full border rounded p-2"
                >
                  <option value="">Select...</option>
                  <option value="Yes">Yes</option>
                  <option value="No">No</option>
                </select>
              )}
            </motion.div>
          </AnimatePresence>

          {/* Skip / Don't know button */}
          <div className="mt-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                const qId = currentQuestions[step].id;
                setAnswers((prev) => ({ ...prev, [qId]: null, [`${qId}_skip_reason`]: "unknown" }));
                if (step < currentQuestions.length - 1) {
                  setStep(step + 1);
                } else {
                  handleNext();
                }
              }}
            >
              Skip / Don't know
            </Button>
          </div>

          <div className="flex justify-between mt-4">
            {step > 0 && (
              <Button variant="outline" onClick={() => setStep(step - 1)}>
                Back
              </Button>
            )}
            <Button onClick={handleNext} disabled={loading}>
              {loading
                ? "Processing..."
                : step < currentQuestions.length - 1
                ? "Next"
                : showMicroQuestions
                ? "Complete"
                : "See Results"}
            </Button>
          </div>

          <div className="mt-4 text-sm text-gray-500">
            Question {step + 1} of {currentQuestions.length}
          </div>
        </div>
      ) : (
        <div>
          <label className="block text-sm font-medium mb-2">Describe your situation:</label>
          <textarea
            value={answers.freeText || ""}
            onChange={(e) => setAnswers({ ...answers, freeText: e.target.value })}
            placeholder="e.g., I run a bakery in Vienna and need a loan to expand"
            className="w-full border rounded p-2 h-40"
          />
          
          {/* Chips extraction and coverage meter */}
          {answers.freeText && (
            <div className="mt-3 p-3 bg-gray-50 rounded">
              <div className="text-sm font-medium mb-2">Extracted signals:</div>
              <div className="flex flex-wrap gap-2 mb-2">
                {extractChips(answers.freeText).map((chip, i) => (
                  <span key={i} className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">
                    {chip}
                  </span>
                ))}
              </div>
              <div className="text-xs text-gray-600">
                Coverage: {Math.round((extractChips(answers.freeText).length / 8) * 100)}% 
                {extractChips(answers.freeText).length < 4 && " - Consider answering the survey for better matches"}
              </div>
            </div>
          )}
          
          <div className="flex justify-end mt-4">
            <Button onClick={handleNext}>See Results</Button>
          </div>
        </div>
      )}
    </div>
  );
}
