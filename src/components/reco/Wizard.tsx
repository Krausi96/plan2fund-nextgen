import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/router";
import { motion, AnimatePresence } from "framer-motion";
import dynamic from "next/dynamic";

// Dynamic imports to avoid SSR issues
const questionsData = require("@/data/questions.json");
const programsData = require("../../../data/programs.json");

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

  useEffect(() => {
    setMounted(true);
  }, []);

  // Micro-question engine: compute coverage gaps
  const computeMicroQuestions = (currentAnswers: Record<string, any>) => {
    const programs = programsData as any[];
    const topCandidates = programs.slice(0, 5); // Top 5 for coverage analysis
    
    const coverageGaps: string[] = [];
    const microQuestions: any[] = [];
    
    // Use structured questions from questions.json
    const coreQuestions = questionsData.core;
    const microQuestionsData = questionsData.micro;
    
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
      const currentQuestions = showMicroQuestions ? microQuestions : questionsData.core;
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
      const res = await fetch("/api/recommend", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ answers, mode: personaMode }),
      });
      const data = await res.json();
      const signalsHeader = res.headers.get("x-pf-signals")
      if (signalsHeader) {
        try { localStorage.setItem("normalizedAnswers", decodeURIComponent(signalsHeader)) } catch {}
      }

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
      const res = await fetch("/api/recommend/free-text", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ description: answers.freeText || "" }),
      });
      const data = await res.json();
      const signalsHeader = res.headers.get("x-pf-signals")
      if (signalsHeader) {
        try { localStorage.setItem("normalizedAnswers", decodeURIComponent(signalsHeader)) } catch {}
      }

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

  const currentQuestions = showMicroQuestions ? microQuestions : questionsData.core;
  const progressPercent = Math.round(((step + 1) / currentQuestions.length) * 100);

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
                {currentQuestions[step].label}
              </label>
              {currentQuestions[step].type === "select" && (
                <select
                  value={answers[currentQuestions[step].id] || ""}
                  onChange={(e) => handleChange(currentQuestions[step].id, e.target.value)}
                  className="w-full border rounded p-2"
                >
                  <option value="">Select...</option>
                  {currentQuestions[step].options?.map((opt: string) => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))}
                </select>
              )}
              {currentQuestions[step].type === "number" && (
                <input
                  type="number"
                  value={answers[currentQuestions[step].id] || ""}
                  onChange={(e) => handleChange(currentQuestions[step].id, Number(e.target.value))}
                  className="w-full border rounded p-2"
                />
              )}
              {currentQuestions[step].type === "boolean" && (
                <select
                  value={answers[currentQuestions[step].id] || ""}
                  onChange={(e) => handleChange(currentQuestions[step].id, e.target.value === "Yes")}
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
