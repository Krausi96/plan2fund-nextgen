import AppShell from "@/components/layout/AppShell";
import Hero from "@/components/landing/Hero";
import Quote from "@/components/landing/Quote";
import UseCases from "@/components/landing/UseCases";
import PlanTypes from "@/components/landing/PlanTypes";
import Included from "@/components/landing/Included";

export default function Home() {
  return (
    <AppShell>
      <div className="flex flex-col space-y-12">
        <Hero />
        <Quote />
        <UseCases />
        <PlanTypes />
        <Included />
      </div>
    </AppShell>
  );
}
