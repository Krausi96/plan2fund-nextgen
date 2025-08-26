import AppShell from "@/components/layout/AppShell"
import QuestionWizard from "@/components/flow/QuestionWizard"
import { useRouter } from "next/router"

export default function RecoPage() {
  const router = useRouter()

  return (
    <AppShell breadcrumb={["Home", "Recommendation"]}>
      <div className="max-w-xl mx-auto mt-10">
        <h1 className="text-2xl font-bold mb-6">Find the right funding program</h1>
        <QuestionWizard onComplete={(answers) => {
          console.log("Answers:", answers)
          router.push("/results")
        }} />
      </div>
    </AppShell>
  )
}
