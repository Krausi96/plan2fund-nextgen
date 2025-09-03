import { useRouter } from "next/router";
import Link from "next/link";
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
      <div className="flex justify-between pt-6">
        <Link href={program ? `/results` : `/reco`} className="px-4 py-2 rounded-lg bg-gray-100 hover:bg-gray-200">← Back</Link>
        <Link href="/preview" className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700">Continue →</Link>
      </div>
    </div>
  );
}
