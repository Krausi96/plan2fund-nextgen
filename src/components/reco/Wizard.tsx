import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";

const questions = [
  { id: 1, text: "What is your sector?" },
  { id: 2, text: "Where is your location?" },
  { id: 3, text: "What is your company stage?" },
];

export default function Wizard() {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Record<number, string>>({});

  const handleNext = () => {
    if (step < questions.length - 1) {
      setStep(step + 1);
    } else {
      alert("Stub: Show program recommendations (static JSON)");
    }
  };

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
