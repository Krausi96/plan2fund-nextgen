import { useRouter } from "next/router";
import { useState } from "react";
import ProgramAwareEditor, { PlanDocument } from "../../src/components/plan/ProgramAwareEditor";
import programs from "../../src/data/programs";
import { UserProfile } from "../../src/types";

export default function PlanPage() {
  const router = useRouter();
  const programId = router.query.programId as string | undefined;
  const rawProgram = programs.programs.find((p: any) => p.id === programId);
  
  // Transform program data to match ProgramAwareEditor's expected structure
  const selectedProgram = rawProgram ? {
    id: rawProgram.id,
    name: rawProgram.name,
    type: rawProgram.type,
    region: (rawProgram as any).jurisdiction || 'Unknown',
    maxAmount: (rawProgram as any).thresholds?.max_grant_eur || 0,
    requirements: (rawProgram as any).eligibility || [],
    link: (rawProgram as any).evidence_links?.[0] || ""
  } : undefined;

  // Create a default user profile
  const [userProfile] = useState<UserProfile>({
    id: `user_${Date.now()}`,
    segment: 'B2C_FOUNDER',
    programType: selectedProgram?.type?.toUpperCase() as any || 'GRANT',
    country: 'AT',
    stage: 'PRE_COMPANY',
    theme: 'INNOVATION_DIGITAL'
  });

  const handleSave = (plan: PlanDocument) => {
    console.log('Plan saved:', plan);
    // Store in localStorage for now
    localStorage.setItem('currentPlan', JSON.stringify(plan));
  };

  const handleExport = (plan: PlanDocument) => {
    console.log('Plan exported:', plan);
    // Export functionality would go here
    alert('Export functionality coming soon!');
  };

  return (
    <div className="h-screen">
      {selectedProgram && (
        <div className="absolute top-4 left-4 z-10 p-3 bg-blue-50 border rounded shadow-sm">
          <p className="text-sm text-blue-600">Generating plan for:</p>
          <p className="font-semibold text-blue-800">{selectedProgram.name}</p>
        </div>
      )}
      <ProgramAwareEditor 
        userProfile={userProfile}
        selectedProgram={selectedProgram}
        onSave={handleSave}
        onExport={handleExport}
      />
    </div>
  );
}
