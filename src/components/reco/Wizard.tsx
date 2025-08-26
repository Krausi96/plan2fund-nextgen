import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import ProgramCard from "./ProgramCard";

const questions = [
  { id: 1, text: "What is your sector?" },
  { id: 2, text: "Where is your location?" },
  { id: 3, text: "What is your company stage?" },
];

const mockResults = [
  {
    name: "AWS PreSeed",
    score: 92,
    eligibility: "Eligible",
    confidence: "High",
    reason: "Best match for early-stage tech in Austria",
  },
  {
    name: "FFG Basisprogramm",
    score: 80,
    eligibility: "Eligible",
    confidence: "Medium",
    reason: "Supports innovative projects with R&D focus",
  },
  {
    name: "WKO Gründerfonds",
    score: 65,
    eligibility: "Eligible",
    confidence: "Low",
    reason: "May apply depending on SME status",
  },
];

export default function Wizard() {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [showResults, setShowResults] = useState(false);

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
        <h2 className="text-2xl font-bold mb-6">Top Funding Programs</h2>
        {mockResults.map((p, idx) => (
          <ProgramCard key={idx} {...p} />
        ))}
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
