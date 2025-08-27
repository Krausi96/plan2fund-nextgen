import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/router";
import questions from "@/data/questions.json";
import { motion, AnimatePresence } from "framer-motion";

export default function Wizard() {
  const router = useRouter();
  const [mode, setMode] = useState<"survey" | "freeText">("survey");
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);

  const handleNext = async () => {
    if (mode === "survey") {
      if (step < questions.length - 1) {
        setStep(step + 1);
      } else {
        // Submit to backend API
        try {
          setLoading(true);
          const res = await fetch("/api/recommend", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ answers, mode }),
          });
          const data = await res.json();

          localStorage.setItem("recoResults", JSON.stringify(data.recommendations));
          localStorage.setItem("normalizedAnswers", JSON.stringify(data.normalizedAnswers));
          router.push("/results");
        } catch (err) {
          console.error("Error submitting answers:", err);
        } finally {
          setLoading(false);
        }
      }
    } else {
      localStorage.setItem("freeTextReco", answers.freeText || "");
      router.push("/results");
    }
  };

  const handleChange = (key: string, value: any) => {
    setAnswers((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const progressPercent = Math.round(((step + 1) / questions.length) * 100);

  return (
    <div className="p-6 max-w-lg mx-auto">
      <h2 className="text-xl font-semibold mb-4">Funding Recommendation Wizard</h2>

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
                {questions[step].label}
              </label>
              {questions[step].type === "select" && (
                <select
                  value={answers[questions[step].id] || ""}
                  onChange={(e) => handleChange(questions[step].id, e.target.value)}
                  className="w-full border rounded p-2"
                >
                  <option value="">Select...</option>
                  {questions[step].options?.map((opt: string) => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))}
                </select>
              )}
              {questions[step].type === "number" && (
                <input
                  type="number"
                  value={answers[questions[step].id] || ""}
                  onChange={(e) => handleChange(questions[step].id, Number(e.target.value))}
                  className="w-full border rounded p-2"
                />
              )}
              {questions[step].type === "boolean" && (
                <select
                  value={answers[questions[step].id] || ""}
                  onChange={(e) => handleChange(questions[step].id, e.target.value === "Yes")}
                  className="w-full border rounded p-2"
                >
                  <option value="">Select...</option>
                  <option value="Yes">Yes</option>
                  <option value="No">No</option>
                </select>
              )}
            </motion.div>
          </AnimatePresence>

          <div className="flex justify-between">
            {step > 0 && (
              <Button variant="outline" onClick={() => setStep(step - 1)}>
                Back
              </Button>
            )}
            <Button onClick={handleNext} disabled={loading}>
              {loading
                ? "Processing..."
                : step < questions.length - 1
                ? "Next"
                : "See Results"}
            </Button>
          </div>

          <div className="mt-4 text-sm text-gray-500">
            Question {step + 1} of {questions.length}
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
          <div className="flex justify-end mt-4">
            <Button onClick={handleNext}>See Results</Button>
          </div>
        </div>
      )}
    </div>
  );
}

// Persona mode toggle
const [personaMode, setPersonaMode] = useState<"strict" | "explorer">("strict");
