import React from "react";
import { motion } from "framer-motion";
import QuestionWizard from "@/components/QuestionWizard";
import FundingResults from "@/components/FundingResults";

export default function RecoPage() {
  return (
    <main className="font-sans bg-gray-50 min-h-screen">
      <section className="py-16 text-center bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg">
        <h1 className="text-4xl font-bold">Funding Recommendation Engine</h1>
        <p className="mt-2 text-lg opacity-90">
          Answer 3 quick questions and get your top funding matches.
        </p>
      </section>
import React, { useState } from "react";
import { motion } from "framer-motion";
import { Lightbulb, ArrowRight } from "lucide-react";

interface Question {
  id: string;
  label: string;
  subtext: string;
  options: string[];
}

const questions: Question[] = [
  {
    id: "sector",
    label: "What is your startup’s sector?",
    subtext: "We ask this because many funding programs are sector-specific.",
    options: ["Tech", "Healthcare", "Creative", "Other"],
  },
  {
    id: "location",
    label: "Where are you located?",
    subtext: "Funding often depends on your geographic location.",
    options: ["Austria", "EU", "Outside EU"],
  },
  {
    id: "stage",
    label: "What stage is your project?",
    subtext: "Your maturity stage affects eligibility for programs.",
    options: ["Idea", "Prototype", "Revenue", "Scaling"],
  },
];

export default function QuestionWizard() {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});

  const current = questions[step];
  const progress = ((step + 1) / questions.length) * 100;

  const handleAnswer = (value: string) => {
    setAnswers({ ...answers, [current.id]: value });
  };

  const nextStep = () => {
    if (step < questions.length - 1) {
      setStep(step + 1);
    }
  };

  return (
    <div className="bg-white shadow-lg rounded-2xl p-8">
      {/* Progress bar */}
      <div className="mb-6">
        <div className="flex justify-between mb-1 text-sm text-gray-600">
          <span>
            Question {step + 1} of {questions.length}
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <motion.div
            className="bg-blue-600 h-2 rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.5 }}
          />
        </div>
      </div>

      {/* Question */}
      <motion.h2
        key={current.id}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="text-xl font-semibold mb-2"
      >
        {current.label}
      </motion.h2>
      <p className="text-gray-600 text-sm mb-4">{current.subtext}</p>

      {/* Options */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        {current.options.map((opt) => (
          <button
            key={opt}
            onClick={() => handleAnswer(opt)}
            className={`px-4 py-2 rounded-xl border transition ${
              answers[current.id] === opt
                ? "bg-blue-600 text-white border-blue-600"
                : "bg-gray-50 hover:bg-gray-100 border-gray-300 text-gray-800"
            }`}
          >
            {opt}
          </button>
        ))}
      </div>

      {/* Next button */}
      {step < questions.length - 1 ? (
        <button
          onClick={nextStep}
          disabled={!answers[current.id]}
          className={`px-6 py-3 rounded-xl flex items-center gap-2 ${
            answers[current.id]
              ? "bg-blue-600 text-white hover:bg-blue-700"
              : "bg-gray-200 text-gray-400 cursor-not-allowed"
          }`}
        >
          Next <ArrowRight size={16} />
        </button>
      ) : (
        <p className="text-green-600 font-semibold">✅ All questions answered</p>
      )}

      {/* Expert shortcut */}
      <div className="mt-6 border-t pt-4 text-sm text-gray-600">
        <p className="mb-2 font-medium">Already know your program?</p>
        <input
          type="text"
          placeholder="Enter program name..."
          className="w-full px-4 py-2 rounded-xl border border-gray-300 focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* Persona hint (example for Newbie) */}
      <div className="mt-4 flex items-start gap-2 text-blue-600 text-sm">
        <Lightbulb size={18} />
        <p>Tip: Your answers help us filter eligible funding programs faster.</p>
      </div>
    </div>
  );
}

      <section className="max-w-3xl mx-auto py-12 px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <QuestionWizard />
        </motion.div>
      </section>

      <FundingResults />
    </main>
  );
}
