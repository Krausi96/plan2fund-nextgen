import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export default function Wizard() {
  const [step, setStep] = useState(0);
  const questions = [
    "What is your business idea?",
    "Who is your target audience?",
    "How much funding do you need?",
  ];

  return (
    <Card className="p-4 space-y-4">
      <h2 className="text-xl font-bold">Recommendation Wizard</h2>
      {step < questions.length ? (
        <>
          <p>{questions[step]}</p>
          <Button onClick={() => setStep(step + 1)}>Next</Button>
        </>
      ) : (
        <p>? Wizard Complete! Go to <a href="/results" className="text-blue-500 underline">Results</a></p>
      )}
    </Card>
  );
}
