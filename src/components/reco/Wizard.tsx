import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { scorePrograms, UserAnswers } from "@/lib/recoEngine";
import { useRouter } from "next/router";

export default function Wizard() {
  const router = useRouter();
  const [mode, setMode] = useState<"survey" | "freeText">("survey");
  const [answers, setAnswers] = useState<UserAnswers & { freeText?: string }>({
    sector: "",
    location: "",
    stage: "",
    need: "",
    fundingSize: undefined,
    freeText: "",
  });
  const [step, setStep] = useState(0);

  const questions = [
    { key: "sector", label: "Which sector are you in?", type: "dropdown", options: ["Tech", "Retail", "Services", "Consulting", "Other"] },
    { key: "location", label: "Where is your business located?", type: "dropdown", options: ["AT", "DE", "EU", "Other"] },
    { key: "stage", label: "What stage is your business in?", type: "dropdown", options: ["Idea", "Early", "Growth"] },
    { key: "need", label: "What is your funding need?", type: "dropdown", options: ["Visa", "Grant", "Loan", "Coaching"] },
    { key: "fundingSize", label: "How much funding do you need (EUR)?", type: "number" },
  ];

  const handleNext = () => {
    if (mode === "survey") {
      if (step < questions.length - 1) {
        setStep(step + 1);
      } else {
        const results = scorePrograms(answers);
        localStorage.setItem("recoResults", JSON.stringify(results));
        router.push("/results");
      }
    } else {
      // Free text mode → store text for later GPT normalization
      localStorage.setItem("freeTextReco", answers.freeText || "");
      router.push("/results");
    }
  };

  const handleChange = (key: string, value: string) => {
    setAnswers((prev) => ({
      ...prev,
      [key]: key === "fundingSize" ? Number(value) : value,
    }));
  };

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

      {mode === "survey" ? (
        <div>
          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">{questions[step].label}</label>
            {questions[step].type === "dropdown" ? (
              <select
                value={(answers as any)[questions[step].key] || ""}
                onChange={(e) => handleChange(questions[step].key, e.target.value)}
                className="w-full border rounded p-2"
              >
                <option value="">Select...</option>
                {questions[step].options?.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
            ) : (
              <input
                type={questions[step].type}
                value={(answers as any)[questions[step].key] || ""}
                onChange={(e) => handleChange(questions[step].key, e.target.value)}
                className="w-full border rounded p-2"
              />
            )}
          </div>
          <div className="flex justify-between">
            {step > 0 && (
              <Button variant="outline" onClick={() => setStep(step - 1)}>
                Back
              </Button>
            )}
            <Button onClick={handleNext}>
              {step < questions.length - 1 ? "Next" : "See Results"}
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
