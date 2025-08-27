import Link from "next/link"
import { useRouter } from "next/router"

const stepsReco = [
  { href: "/reco", label: "Recommendation" },
  { href: "/results", label: "Results" },
  { href: "/eligibility", label: "Eligibility" },
  { href: "/plan", label: "Plan" },
  { href: "/review", label: "Review" },
  { href: "/preview", label: "Preview" },
  { href: "/confirmation", label: "Confirmation" },
  { href: "/checkout", label: "Checkout" },
  { href: "/export", label: "Export" },
  { href: "/thank-you", label: "Thank You" },
]

const stepsDirect = [
  { href: "/plan", label: "Plan" },
  { href: "/review", label: "Review" },
  { href: "/preview", label: "Preview" },
  { href: "/confirmation", label: "Confirmation" },
  { href: "/checkout", label: "Checkout" },
  { href: "/export", label: "Export" },
  { href: "/thank-you", label: "Thank You" },
]

export default function Breadcrumbs() {
  const router = useRouter()
  const path = router.pathname

  const isRecoFlow = ["/reco", "/results", "/eligibility"].some((p) =>
    path.startsWith(p)
  )
  const steps = isRecoFlow ? stepsReco : stepsDirect

  const currentIndex = steps.findIndex((step) => step.href === path)

  return (
    <div className="w-full bg-gray-50 py-4">
      <nav className="flex justify-center gap-6 text-sm text-gray-600">
        {steps.map((step, i) => {
          const isActive = i === currentIndex
          const isCompleted = i < currentIndex
          const isClickable = isCompleted || isActive

          const baseClass =
            "flex items-center gap-1 " +
            (isActive
              ? "font-semibold text-blue-600"
              : isCompleted
              ? "text-gray-500 hover:underline"
              : "text-gray-400 cursor-not-allowed")

          return isClickable ? (
            <Link key={i} href={step.href} className={baseClass}>
              <span>{isCompleted ? "✔" : isActive ? "➡" : "○"}</span>
              {step.label}
            </Link>
          ) : (
            <span key={i} className={baseClass}>
              <span>○</span>
              {step.label}
            </span>
          )
        })}
      </nav>
    </div>
  )
}
