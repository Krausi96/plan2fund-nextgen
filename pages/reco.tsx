import EduPanel from "@/components/reco/EduPanel";

export default function RecoPage() {
  return (
    <div className="max-w-5xl mx-auto p-6 grid md:grid-cols-[1fr_280px] gap-6">
      <div className="p-6 bg-white rounded-lg">
        <h1 className="text-2xl font-bold mb-4">Test Page</h1>
        <p className="text-gray-600">This is a simple test page with no data loading.</p>
        <p className="text-green-600 mt-2">✅ If you see this without errors, the issue is with the Wizard component.</p>
        <p className="text-red-600 mt-2">❌ If you still see JSON parsing errors, the issue is elsewhere on the page.</p>
      </div>
      <div className="space-y-4">
        <EduPanel />
      </div>
    </div>
  );
}

