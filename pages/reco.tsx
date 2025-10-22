import SmartWizard from "@/components/wizard/SmartWizard";

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
      <SmartWizard />
    </div>
  );
}

