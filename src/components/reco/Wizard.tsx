import { useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";

const steps = [
  { id: 1, question: "What’s your goal? (Visa, Grant, Loan…)" },
  { id: 2, question: "What stage are you at? (Idea, Early, Scaling…)" },
  { id: 3, question: "How much funding do you need?" }
];

export default function Wizard() {
  const [step, setStep] = useState(0);

  return (
    <div className="max-w-xl mx-auto py-10 text-center space-y-6">
      <motion.h2
        key={step}
        initial={{ opacity: 0, x: 50 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -50 }}
        transition={{ ease: "easeInOut", duration: 0.4 }}
        className="text-xl font-semibold"
      >
        {steps[step]?.question ?? "All done!"}
      </motion.h2>

      <div className="flex justify-center gap-4">
        {step < steps.length ? (
          <Button onClick={() => setStep(step + 1)}>Next</Button>
        ) : (
          <Button asChild>
            <a href="/results">See Results</a>
          </Button>
        )}
      </div>
    </div>
  );
}
