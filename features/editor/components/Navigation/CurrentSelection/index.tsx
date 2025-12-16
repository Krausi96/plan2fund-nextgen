import React from 'react';
import ProductSelection from './ProductSelection/ProductSelection';
import ProgramSelection from './ProgramSelection/ProgramSelection';
import SectionsDocumentsManagement from './SectionsDocumentsManagement/SectionsDocumentsManagement';

type CurrentSelectionProps = {
  // No props needed - component uses store hooks directly
};

/**
 * CurrentSelection component
 * Main configurator component that orchestrates ProductSelection, ProgramSelection, and SectionsDocumentsManagement
 * Optimized: Uses unified configurator state hook, no prop drilling
 */
function CurrentSelection({}: CurrentSelectionProps) {
  return (
    <div className="space-y-4">
      {/* Step 1: Product Selection */}
      <ProductSelection />

      {/* Step 2: Program Selection */}
      <ProgramSelection
        onOpenProgramFinder={() => {
          // Program finder logic would go here
          console.log('Open program finder');
        }}
      />

      {/* Step 3: Sections & Documents Management */}
      <SectionsDocumentsManagement />
    </div>
  );
}

// Memoize component to prevent unnecessary re-renders when parent re-renders
export default React.memo(CurrentSelection);
