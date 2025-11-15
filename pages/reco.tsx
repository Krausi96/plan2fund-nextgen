import ProgramFinder from "@/features/reco/components/ProgramFinder";
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
        text="Answer questions to find funding programs that match your business needs."
        duration={5000}
        position="top-right"
      />
      <ProgramFinder />
    </>
  );
}

export default RecoPage;

