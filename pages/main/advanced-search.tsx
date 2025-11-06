import ProgramFinder from '@/features/reco/components/ProgramFinder';
import PageEntryIndicator from '@/shared/components/common/PageEntryIndicator';

// Unified ProgramFinder replaces old Advanced Search
export default function AdvancedSearch() {
  return (
    <>
      <PageEntryIndicator 
        icon="hint"
        text="Search manually or use filters to find programs."
        duration={5000}
        position="top-right"
      />
      <ProgramFinder initialMode="manual" />
    </>
  );
}
