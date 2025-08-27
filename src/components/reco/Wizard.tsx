import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { scorePrograms, UserAnswers } from "@/lib/recoEngine";
import { useRouter } from "next/router";

export default function Wizard() {
  const router = useRouter();
  const [answers, setAnswers] = useState<UserAnswers>({
    sector: "",
    location: "",
    stage: "",
    need: "",
    fundingSize: undefined,
  });
  const [step, setStep] = useState(0);

  const questions = [
    { key: "sector", label: "Which sector are you in?", type: "text" },
    { key: "location", label: "Where is your business located?", type: "text" },
    { key: "stage", label: "What stage is your business in? (idea, early, growth)", type: "text" },
    { key: "need", label: "What is your funding need? (visa, grant, loan, coaching)", type: "text" },
    { key: "fundingSize", label: "How much funding do you need (EUR)?", type: "number" },
  ];

  const handleNext = () => {
    if (step < questions.length - 1) {
      setStep(step + 1);
    } else {
      // Final step → score and redirect
      const results = scorePrograms(answers);
      localStorage.setItem("recoResults", JSON.stringify(results));
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
      <div className="mb-4">
        <label className="block text-sm font-medium mb-2">{questions[step].label}</label>
        <input
          type={questions[step].type}
          value={(answers as any)[questions[step].key] || ""}
          onChange={(e) => handleChange(questions[step].key, e.target.value)}
          className="w-full border rounded p-2"
        />
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
      <div className="mt-4 text-sm text-gray-500">Question {step + 1} of {questions.length}</div>
    </div>
  );
}
