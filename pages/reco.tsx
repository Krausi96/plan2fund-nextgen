import SmartWizard from "@/components/wizard/SmartWizard";
import Link from "next/link";

export default function RecoPage() {
  // Lightweight render timing to investigate slow loads
  if (typeof window !== 'undefined') {
    performance.mark('reco-render-start');
    requestAnimationFrame(() => {
      performance.mark('reco-render-end');
      performance.measure('reco-render', 'reco-render-start', 'reco-render-end');
      const measures = performance.getEntriesByName('reco-render');
      if (measures && measures[0]) {
        console.log(`[Reco] Render time: ${Math.round(measures[0].duration)}ms`);
        performance.clearMeasures('reco-render');
        performance.clearMarks('reco-render-start');
        performance.clearMarks('reco-render-end');
      }
    });
  }

  return (
    <div className="max-w-5xl mx-auto p-6">
      {/* Page Header with Advanced Search Link */}
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Funding Recommendations</h1>
          <p className="text-gray-600 mt-2">Find the perfect funding match for your business</p>
        </div>
        <Link 
          href="/advanced-search" 
          className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          Advanced Search
        </Link>
      </div>
      
      <SmartWizard />
    </div>
  );
}

