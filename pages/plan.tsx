import AppShell from "@/components/layout/AppShell";
import Editor from "@/components/plan/Editor";
import SideNav from "@/components/plan/SideNav";

export default function PlanPage() {
  return (
    <AppShell>
      <div className="flex">
        <SideNav />
        <Editor />
      </div>
    </AppShell>
  );
}
