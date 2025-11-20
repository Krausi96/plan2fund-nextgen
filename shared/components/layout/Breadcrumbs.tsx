import Link from "next/link"
import { useRouter } from "next/router"
import { useI18n } from "@/shared/contexts/I18nContext"

export default function Breadcrumbs() {
  const router = useRouter()
  const { t } = useI18n()
  const path = router.pathname

  const stepsReco = [
    { href: "/", label: t('breadcrumb.home') },
    { href: "/reco", label: t('breadcrumb.recommendation') },
    // Removed /results - results are now shown inline in ProgramFinder
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

  const isRecoFlow = ["/reco"].some((p) =>
    path.startsWith(p)
  )
  const steps = isRecoFlow ? stepsReco : stepsDirect

  const currentIndex = steps.findIndex((step) => step.href === path)

  // Only show steps up to the current one
  const visibleSteps =
    currentIndex >= 0 ? steps.slice(0, currentIndex + 1) : steps

  return (
    <div className="w-full bg-gray-50 py-4">
      <nav className="flex justify-center items-center gap-2 text-sm" aria-label="Breadcrumb">
        {visibleSteps.map((step, i) => {
          const isActive = i === currentIndex
          const isCompleted = i < currentIndex

          return (
            <div key={i} className="flex items-center gap-2">
              {i > 0 && (
                <span className="text-gray-400" aria-hidden="true">
                  &gt;
                </span>
              )}
              {isActive ? (
                <span className="font-semibold text-neutral-900" aria-current="page">
                  {step.label}
                </span>
              ) : isCompleted ? (
                <Link 
                  href={step.href} 
                  className="text-gray-600 hover:text-neutral-900 hover:underline transition-colors"
                >
                  {step.label}
                </Link>
              ) : (
                <span className="text-gray-400 cursor-not-allowed">
                  {step.label}
                </span>
              )}
            </div>
          )
        })}
      </nav>
    </div>
  )
}

