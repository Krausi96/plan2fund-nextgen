import ProgramFinder from "@/platform/reco/components/ProgramFinder";
import { useEffect } from "react";
import analytics from "@/shared/user/analytics";
import PageEntryIndicator from '@/shared/components/common/PageEntryIndicator';

function RecoPage() {
  useEffect(() => {
    analytics.trackPageView('/reco', 'Recommendations');
    analytics.trackUserAction('reco_started', {});
  }, []);

  return (
    <>
      <PageEntryIndicator 
        icon="hint"
        translationKey="reco"
        duration={0}
      />
      <ProgramFinder />
    </>
  );
}

export default RecoPage;

