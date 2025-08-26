import PreviewPanel from "@/components/preview/PreviewPanel";
import PricingPanel from "@/components/preview/PricingPanel";
import AppShell from "@/components/layout/AppShell";

export default function PreviewPage() {
  return (
    <AppShell>
      <div className="max-w-3xl mx-auto p-6 space-y-6">
        <PreviewPanel completeness={70} complexity={50} />
        <PricingPanel />
      </div>
    </AppShell>
  );
}
