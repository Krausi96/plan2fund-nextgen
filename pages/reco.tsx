import Wizard from "@/components/reco/Wizard";
import EduPanel from "@/components/reco/EduPanel";
import SignalsPanel from "@/components/reco/SignalsPanel";

export default function RecoPage() {
  return (
    <div className="max-w-5xl mx-auto p-6 grid md:grid-cols-[1fr_280px] gap-6">
      <Wizard />
      <div className="space-y-4">
        <SignalsPanel />
        <EduPanel />
      </div>
    </div>
  );
}

