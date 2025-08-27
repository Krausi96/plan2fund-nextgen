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

  // Decide flow
  const isRecoFlow = ["/reco", "/results", "/eligibility"].some(p => path.startsWith(p))
  const steps = isRecoFlow ? stepsReco : stepsDirect

  return (
    <div className="w-full bg-gray-50 py-4">
      <nav className="flex justify-center gap-4 text-sm text-gray-600">
        {steps.map((step, i) => {
          const isActive = path === step.href
          return (
            <Link
              key={i}
              href={step.href}
              className={
                isActive
                  ? "font-semibold text-blue-600"
                  : "hover:underline"
              }
            >
              {step.label}
            </Link>
          )
        })}
      </nav>
    </div>
  )
}
