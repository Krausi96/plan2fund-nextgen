import Link from "next/link"
import { useRouter } from "next/router"

const stepsReco = [
  { href: "/", label: "Home" },
  { href: "/reco", label: "Recommendation" },
  { href: "/results", label: "Results" },
  { href: "/plan/intake", label: "Plan Intake" },
  { href: "/plan", label: "Plan" },
  { href: "/preview", label: "Preview" },
  { href: "/pricing", label: "Pricing" },
  { href: "/confirm", label: "Confirm" },
  { href: "/checkout", label: "Checkout" },
  { href: "/export", label: "Export" },
  { href: "/thank-you", label: "Success Hub" },
]

const stepsDirect = [
  { href: "/", label: "Home" },
  { href: "/plan/intake", label: "Plan Intake" },
  { href: "/plan", label: "Plan" },
  { href: "/preview", label: "Preview" },
  { href: "/pricing", label: "Pricing" },
  { href: "/confirm", label: "Confirm" },
  { href: "/checkout", label: "Checkout" },
  { href: "/export", label: "Export" },
  { href: "/thank-you", label: "Success Hub" },
]

export default function Breadcrumbs() {
  const router = useRouter()
  const path = router.pathname

  const isRecoFlow = ["/reco", "/results"].some((p) =>
    path.startsWith(p)
  )
  const steps = isRecoFlow ? stepsReco : stepsDirect

  const currentIndex = steps.findIndex((step) => step.href === path)

  // Only show steps up to the current one
  const visibleSteps =
    currentIndex >= 0 ? steps.slice(0, currentIndex + 1) : steps

  return (
    <div className="w-full bg-gray-50 py-4">
      <nav className="flex justify-center gap-6 text-sm text-gray-600">
        {visibleSteps.map((step, i) => {
          const isActive = i === currentIndex
          const isCompleted = i < currentIndex

          const baseClass =
            "flex items-center gap-1 " +
            (isActive
              ? "font-semibold text-blue-600"
              : isCompleted
              ? "text-gray-500 hover:underline"
              : "text-gray-400 cursor-not-allowed")

          return (
            <Link key={i} href={step.href} className={baseClass}>
              <span>{isCompleted ? "✔" : isActive ? "➡" : "○"}</span>
              {step.label}
            </Link>
          )
        })}
      </nav>
    </div>
  )
}

