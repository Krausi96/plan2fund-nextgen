import AppShell from "@/components/layout/AppShell";
import Hero from "@/components/Hero";
import Quote from "@/components/home/Quote";
import UseCases from "@/components/home/UseCases";
import PlanTypes from "@/components/home/PlanTypes";
import Included from "@/components/home/Included";

export default function HomePage() {
  return (
    <AppShell>
      <Hero />
      <Quote />
      <UseCases />
      <PlanTypes />
      <Included />
    </AppShell>
  );
}
