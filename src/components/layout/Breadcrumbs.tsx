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

export function Breadcrumbs() {
  const router = useRouter()
  const path = router.pathname

  const steps = path.startsWith("/reco") || path.startsWith("/results") || path.startsWith("/eligibility")
    ? stepsReco
    : stepsDirect

  return (
    <nav className="flex flex-wrap gap-2 text-sm text-gray-600 mb-4">
      {steps.map((step, i) => {
        const isActive = path === step.href
        return (
          <Link
            key={i}
            href={step.href}
            className={isActive ? "font-bold text-blue-600" : "hover:underline"}
          >
            {step.label}
          </Link>
        )
      })}
    </nav>
  )
}
