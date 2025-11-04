import SimpleWizard from "@/features/reco/components/wizard/SimpleWizard";
import { useEffect } from "react";
import analytics from "@/shared/lib/analytics";

function RecoPage() {
  useEffect(() => {
    analytics.trackPageView('/reco', 'Recommendations');
    analytics.trackUserAction('reco_started', {});
  }, []);

  return (
    <div className="max-w-5xl mx-auto p-6">
      <SimpleWizard />
    </div>
  );
}

export default RecoPage;

