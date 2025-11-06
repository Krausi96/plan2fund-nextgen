import ProgramFinder from "@/features/reco/components/ProgramFinder";
import { useEffect } from "react";
import analytics from "@/shared/lib/analytics";

function RecoPage() {
  useEffect(() => {
    analytics.trackPageView('/reco', 'Recommendations');
    analytics.trackUserAction('reco_started', {});
  }, []);

  return <ProgramFinder initialMode="guided" />;
}

export default RecoPage;

