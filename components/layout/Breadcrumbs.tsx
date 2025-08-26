"use client";

import Link from "next/link";
import { useRouter } from "next/router";
import { ChevronRight } from "lucide-react";

const steps = [
  { id: "reco", title: "Find Funding", href: "/reco" },
  { id: "plan", title: "Business Plan", href: "/plan" },
  { id: "preview", title: "Preview", href: "/preview" },
  { id: "confirmation", title: "Confirmation", href: "/confirmation" },
  { id: "checkout", title: "Checkout", href: "/checkout" },
  { id: "export", title: "Export", href: "/export" },
  { id: "thanks", title: "Thank You", href: "/thanks" },
];

export default function Breadcrumbs() {
  const router = useRouter();
  const currentPath = router.pathname.replace("/", "");

  // Hide "reco" if starting from "plan"
  const visibleSteps =
    currentPath === "plan"
      ? steps.filter((s) => s.id !== "reco")
      : steps;

  const currentIndex = visibleSteps.findIndex(
    (s) => s.id === currentPath
  );

  return (
    <nav className="flex items-center space-x-2 text-sm text-gray-600 my-4">
      {visibleSteps.map((step, idx) => {
        const isActive = idx === currentIndex;
        const isPast = idx < currentIndex;

        return (
          <div key={step.id} className="flex items-center">
            {isPast ? (
              <Link
                href={step.href}
                className="hover:text-blue-600 transition-colors"
              >
                {step.title}
              </Link>
            ) : (
              <span className={isActive ? "font-semibold text-blue-600" : ""}>
                {step.title}
              </span>
            )}
            {idx < visibleSteps.length - 1 && (
              <ChevronRight className="w-4 h-4 mx-2 text-gray-400" />
            )}
          </div>
        );
      })}
    </nav>
  );
}
