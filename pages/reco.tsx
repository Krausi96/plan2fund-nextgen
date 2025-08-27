import AppShell from "@/components/layout/AppShell";
import Wizard from "@/components/reco/Wizard";

export default function RecoPage() {
  return (
    <AppShell breadcrumb={[{ label: 'Home', href: '/' }, { label: 'Recommendations' }]}>
      <Wizard />
    </AppShell>
  );
}
