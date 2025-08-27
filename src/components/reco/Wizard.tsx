import { useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import Link from "next/link";

const steps = [
  { id: 1, question: "What’s your sector?", options: ["Tech", "Health", "Education", "Other"] },
  { id: 2, question: "What stage are you at?", options: ["Idea", "Early", "Scaling"] },
  { id: 3, question: "How much funding do you need?", options: ["< €50k", "€50k–200k", "€200k+"] }
];

export default function Wizard() {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Record<number, string>>({});

  const current = steps[step];
  const totalSteps = steps.length;

  return (
    <div className="max-w-xl mx-auto py-10 text-center space-y-6">
      {/* Progress */}
      <div className="w-full bg-gray-200 h-2 rounded">
        <motion.div
          className="bg-blue-600 h-2 rounded"
          initial={{ width: 0 }}
          animate={{ width: `${((step) / totalSteps) * 100}%` }}
          transition={{ ease: "easeInOut", duration: 0.3 }}
        />
      </div>

      {/* Question */}
      {current ? (
        <motion.div
          key={current.id}
          initial={{ opacity: 0, x: 40 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -40 }}
          transition={{ ease: "easeInOut", duration: 0.4 }}
        >
          <h2 className="text-xl font-semibold mb-6">{current.question}</h2>
          <div className="grid gap-3">
            {current.options.map((opt) => (
              <button
                key={opt}
                className={`border rounded-lg py-3 ${
                  answers[current.id] === opt
                    ? "bg-blue-600 text-white"
                    : "hover:bg-gray-100"
                }`}
                onClick={() => setAnswers({ ...answers, [current.id]: opt })}
              >
                {opt}
              </button>
            ))}
          </div>

          {/* Navigation */}
          <div className="mt-6 flex justify-between">
            <Button
              variant="outline"
              disabled={step === 0}
              onClick={() => setStep(step - 1)}
            >
              Back
            </Button>
            <Button
              onClick={() => setStep(step + 1)}
              disabled={!answers[current.id]}
            >
              Next
            </Button>
          </div>
        </motion.div>
      ) : (
        <div className="space-y-6">
          <h2 className="text-xl font-semibold">All done!</h2>
          <Button asChild>
            <Link href={{ pathname: "/results", query: answers }}>
              See Results
            </Link>
          </Button>
        </div>
      )}
    </div>
  );
}

