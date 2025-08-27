import { useRouter } from "next/router";
import Editor from "@/components/plan/Editor";
import programs from "@/data/fundingPrograms.json";

export default function PlanPage() {
  const router = useRouter();
  const programId = router.query.programId as string | undefined;
  const program = (programs as any[]).find((p) => p.id === programId);

  return (
    <div className="space-y-6 p-6">
      {program && (
        <div className="mb-4 p-3 bg-blue-50 border rounded">
          <p className="text-sm">Generating plan for:</p>
          <p className="font-semibold">{program.name}</p>
        </div>
      )}
      <Editor program={program} />
    </div>
  );
}
