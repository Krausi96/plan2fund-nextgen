import Link from "next/link"
import { useRouter } from "next/router"
import { useI18n } from "@/contexts/I18nContext"

export default function Breadcrumbs() {
  const router = useRouter()
  const { t } = useI18n()
  const path = router.pathname

  const stepsReco = [
    { href: "/", label: t('breadcrumb.home') },
    { href: "/reco", label: t('breadcrumb.recommendation') },
    { href: "/results", label: t('breadcrumb.results') },
    { href: "/editor", label: t('breadcrumb.editor') },
    { href: "/preview", label: t('breadcrumb.preview') },
    { href: "/confirm", label: t('breadcrumb.confirm') },
    { href: "/checkout", label: t('breadcrumb.checkout') },
    { href: "/export", label: t('breadcrumb.export') },
    { href: "/thank-you", label: t('breadcrumb.successHub') },
  ]

  const stepsDirect = [
    { href: "/", label: t('breadcrumb.home') },
    { href: "/editor", label: t('breadcrumb.editor') },
    { href: "/preview", label: t('breadcrumb.preview') },
    { href: "/confirm", label: t('breadcrumb.confirm') },
    { href: "/checkout", label: t('breadcrumb.checkout') },
    { href: "/export", label: t('breadcrumb.export') },
    { href: "/thank-you", label: t('breadcrumb.successHub') },
  ]

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

