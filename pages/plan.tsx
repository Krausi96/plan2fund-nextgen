import { useRouter } from "next/router";
import Editor from "@/components/plan/Editor";

const mockPrograms = [
  { id: 1, name: "AWS PreSeed" },
  { id: 2, name: "FFG Basisprogramm" },
  { id: 3, name: "EU Startup Call" },
];

export default function PlanPage() {
  const router = useRouter();
  const programId = parseInt(router.query.program as string);
  const program = mockPrograms.find((p) => p.id === programId);

  return (
    <div className="space-y-6 p-6">
      {program && (
        <div className="mb-4 p-3 bg-blue-50 border rounded">
          <p className="text-sm">Generating plan for:</p>
          <p className="font-semibold">{program.name}</p>
        </div>
      )}
      <Editor />
    </div>
  );
}
