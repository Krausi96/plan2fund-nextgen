import Editor from "@/components/plan/Editor";
import AppShell from "@/components/layout/AppShell";
import { Button } from "@/components/ui/button";

export default function PlanPage() {
  return (
    <AppShell>
      <div className="space-y-6">
        <Editor />
        <div className="flex justify-end">
          <Button asChild>
            <a href="/preview">Continue to Preview</a>
          </Button>
        </div>
      </div>
    </AppShell>
  );
}
