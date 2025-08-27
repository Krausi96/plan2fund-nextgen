"use client"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import Link from "next/link"

export default function RecoPage() {
  const questions = ["What is your sector?", "Where are you located?", "What stage are you in?"]
  const [step, setStep] = useState(0)

  return (
    <div className="max-w-xl mx-auto py-10">
      <h1 className="text-2xl font-bold mb-4">Funding Recommendation Wizard</h1>
      <Progress value={(step+1)/questions.length*100} className="mb-4" />
      <p className="mb-6">{questions[step]}</p>
      <div className="flex gap-4">
        <Button onClick={() => setStep(Math.max(0, step-1))} disabled={step===0}>Back</Button>
        {step < questions.length-1 ? (
          <Button onClick={() => setStep(step+1)}>Next</Button>
        ) : (
          <Link href="/results"><Button>See Results</Button></Link>
        )}
      </div>
    </div>
  )
}
