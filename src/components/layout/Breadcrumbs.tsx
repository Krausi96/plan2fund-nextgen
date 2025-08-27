import Link from "next/link";
import { useRouter } from "next/router";

const stepLabels: Record<string, string> = {
  "/reco": "Recommendation Wizard",
  "/results": "Results",
  "/eligibility": "Eligibility",
  "/plan": "Business Plan Editor",
  "/review": "Review Plan",
  "/preview": "Preview",
  "/confirmation": "Confirmation",
  "/checkout": "Checkout",
  "/export": "Export",
  "/thanks": "Thank You",
};

// Two flows
const recoFlow = ["/reco", "/results", "/eligibility", "/plan", "/review", "/preview", "/confirmation", "/checkout", "/export", "/thanks"];
const directPlanFlow = ["/plan", "/review", "/preview", "/confirmation", "/checkout", "/export", "/thanks"];

export default function Breadcrumbs() {
  const router = useRouter();
  const path = router.pathname;
  const query = router.query;

  // Pick flow
  let flow =
    path.startsWith("/reco") ||
    path.startsWith("/results") ||
    path.startsWith("/eligibility")
      ? recoFlow
      : directPlanFlow;

  // If no program selected, skip eligibility
  if (!query.program) {
    flow = flow.filter((step) => step !== "/eligibility");
  }

  const currentIndex = flow.indexOf(path);
  if (currentIndex === -1) return null;

  const trail = flow.slice(0, currentIndex + 1);

  return (
    <nav className="text-sm text-gray-500 mb-4">
      <ol className="flex gap-2 flex-wrap">
        {trail.map((step, i) => {
          const isLast = i === trail.length - 1;
          const href = query.program ? `${step}?program=${query.program}` : step;

          return (
            <li key={step} className="flex items-center gap-2">
              {!isLast ? (
                <Link href={href} className="text-blue-600 hover:underline">
                  {stepLabels[step]}
                </Link>
              ) : (
                <span className="font-semibold text-gray-700">
                  {stepLabels[step]}
                </span>
              )}
              {!isLast && <span>/</span>}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
