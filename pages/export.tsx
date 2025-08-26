import ExportPanel from "@/components/export/ExportPanel";
import { Button } from "@/components/ui/button";
import AppShell from "@/components/layout/AppShell";

export default function ExportPage() {
  return (
    <AppShell>
      <div className="max-w-3xl mx-auto p-6 space-y-6">
        <ExportPanel />
        <div className="flex justify-end">
          <Button asChild>
            <a href="/thanks">Finish</a>
          </Button>
        </div>
      </div>
    </AppShell>
  );
}
