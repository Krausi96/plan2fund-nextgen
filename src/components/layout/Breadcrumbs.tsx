import Link from "next/link";
import { useRouter } from "next/router";

const stepLabels: Record<string, string> = {
  "/reco": "Recommendation Wizard",
  "/results": "Results",
  "/eligibility": "Eligibility",
  "/preview": "Preview",
  "/confirmation": "Confirmation",
  "/checkout": "Checkout",
  "/export": "Export",
  "/thanks": "Thank You",
  "/plan": "Business Plan Editor",
};

export default function Breadcrumbs() {
  const router = useRouter();
  const path = router.pathname;

  // Build trail
  const allSteps = Object.keys(stepLabels);
  const currentIndex = allSteps.indexOf(path);

  if (currentIndex === -1) return null; // no breadcrumbs on landing or static pages

  const trail = allSteps.slice(0, currentIndex + 1);

  return (
    <nav className="text-sm text-gray-500 mb-4">
      <ol className="flex gap-2">
        {trail.map((step, i) => {
          const isLast = i === trail.length - 1;
          return (
            <li key={step} className="flex items-center gap-2">
              {!isLast ? (
                <Link href={step} className="text-blue-600 hover:underline">
                  {stepLabels[step]}
                </Link>
              ) : (
                <span className="font-semibold text-gray-700">{stepLabels[step]}</span>
              )}
              {!isLast && <span>/</span>}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
