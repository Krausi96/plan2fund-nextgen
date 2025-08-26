import RevisionRequest from "@/components/thanks/RevisionRequest";
import Upsell from "@/components/thanks/Upsell";
import AppShell from "@/components/layout/AppShell";

export default function ThanksPage() {
  return (
    <AppShell>
      <div className="max-w-2xl mx-auto p-6 space-y-6 text-center">
        <h1 className="text-2xl font-bold">🎉 Thank You for Your Purchase!</h1>
        <p className="text-gray-600">Your business plan is now ready.</p>
        <RevisionRequest />
        <Upsell />
      </div>
    </AppShell>
  );
}
