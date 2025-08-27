"use client"
import { useRouter } from "next/router"
import { useState } from "react"
import { Button } from "@/components/ui/button"

export default function Wizard() {
  const router = useRouter()
  const [step, setStep] = useState(1)

  const nextStep = () => {
    if (step < 3) {
      setStep(step + 1)
    } else {
      router.push("/results")
    }
  }

  return (
    <div className="p-6">
      <h2 className="text-xl font-bold mb-4">Recommendation Wizard - Step {step}</h2>
      <Button onClick={nextStep}>Next</Button>
    </div>
  )
}
