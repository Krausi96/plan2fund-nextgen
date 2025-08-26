import AppShell from "@/components/layout/AppShell";

export default function PricingPage() {
  return (
    <AppShell>
      <div className="max-w-3xl mx-auto p-6 space-y-6">
        <h1 className="text-2xl font-bold">💶 Pricing</h1>
        <ul className="space-y-4 text-gray-700">
          <li>Basic Submission Plan → €500 – €850</li>
          <li>Custom Business Plan → €1.300 – €2.500</li>
          <li>Review or Upgrade → €800 – €1.300</li>
          <li>Strategy & Modelling Plan → €1.000 – €2.000</li>
          <li>Full Plan + Strategy Combo → €2.000 – €5.000</li>
        </ul>
      </div>
    </AppShell>
  );
}
