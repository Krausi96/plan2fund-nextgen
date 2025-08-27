import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import ProgramCard from "./ProgramCard";
import getEligibility from "./eligibility";
import { getConfidence } from "./confidence";

const questions = [
  { id: 1, text: "What is your sector?" },
  { id: 2, text: "Where is your location?" },
  { id: 3, text: "What is your company stage?" },
];

const programs = [
  { name: "AWS PreSeed", score: 92, reason: "Early-stage funding for tech startups" },
  { name: "FFG Basisprogramm", score: 80, reason: "Supports innovative projects with R&D focus" },
  { name: "WKO Gründerfonds", score: 65, reason: "Targeted for Austrian SMEs" },
];

export default function Wizard() {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [showResults, setShowResults] = useState(false);
  const [strictMode, setStrictMode] = useState(false);

  const handleNext = () => {
    if (step < questions.length - 1) {
      setStep(step + 1);
    } else {
      setShowResults(true);
    }
  };

  if (showResults) {
    return (
      <div className="max-w-2xl mx-auto p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold">Top Funding Programs</h2>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={strictMode}
              onChange={(e) => setStrictMode(e.target.checked)}
            />
            Strict Mode
          </label>
        </div>

        {programs.map((p, idx) => {
          const eligibility = getEligibility(p.name, answers);
          const confidence = getConfidence(p.score, strictMode);
          return (
            <ProgramCard
              key={idx}
              name={p.name}
              score={p.score}
              eligibility={eligibility}
              confidence={confidence}
              reason={p.reason}
            />
          );
        })}

        {strictMode && (
          <div className="mt-6 p-4 border rounded bg-gray-50 text-sm">
            <h3 className="font-semibold mb-2">Debug Panel</h3>
            <pre>{JSON.stringify(answers, null, 2)}</pre>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto p-6">
      <Progress value={((step + 1) / questions.length) * 100} className="mb-6" />

      <AnimatePresence mode="wait">
        <motion.div
          key={questions[step].id}
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -50 }}
          transition={{ duration: 0.4 }}
          className="mb-6"
        >
          <h2 className="text-xl font-semibold mb-4">{questions[step].text}</h2>
          <input
            type="text"
            value={answers[questions[step].id] || ""}
            onChange={(e) =>
              setAnswers({ ...answers, [questions[step].id]: e.target.value })
            }
            className="border rounded-md p-2 w-full"
          />
        </motion.div>
      </AnimatePresence>

      <Button onClick={handleNext} disabled={!answers[questions[step].id]}>
        {step < questions.length - 1 ? "Next" : "See Results"}
      </Button>
    </div>
  );
}

