import dynamic from "next/dynamic"

const PlanIntake = dynamic(() => import("@/components/plan/PlanIntake"), {
  ssr: false,
})

export default function PlanIntakePage() {
  return <PlanIntake />
}


