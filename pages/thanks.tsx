import AppShell from "@/components/layout/AppShell";
import RevisionRequest from "@/components/thanks/RevisionRequest";
import Upsell from "@/components/thanks/Upsell";

export default function ThanksPage() {
  return (
    <AppShell>
      <div className="space-y-8">
        <RevisionRequest />
        <Upsell />
      </div>
    </AppShell>
  );
}
