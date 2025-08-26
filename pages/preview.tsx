import AppShell from "@/components/layout/AppShell";
import PreviewPanel from "@/components/preview/PreviewPanel";
import PricingPanel from "@/components/preview/PricingPanel";

export default function PreviewPage() {
  return (
    <AppShell>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <PreviewPanel />
        <PricingPanel />
      </div>
    </AppShell>
  );
}
