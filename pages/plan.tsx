import AppShell from "@/components/layout/AppShell";
import Breadcrumbs from "@/components/layout/Breadcrumbs";
import Editor from "@/components/plan/Editor";

export default function PlanPage() {
  return (
    <AppShell>
      <Breadcrumbs />
      <section className="py-12 max-w-4xl mx-auto">
        <Editor />
      </section>
    </AppShell>
  );
}
