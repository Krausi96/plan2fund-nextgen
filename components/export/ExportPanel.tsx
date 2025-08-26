import { useRef } from "react";
import { Button } from "@/components/ui/button";
import html2pdf from "html2pdf.js";

export default function ExportPanel() {
  const contentRef = useRef<HTMLDivElement>(null);

  const handleExportPDF = () => {
    if (!contentRef.current) return;
    html2pdf().from(contentRef.current).save("business-plan.pdf");
  };

  return (
    <div className="space-y-6">
      <div
        ref={contentRef}
        className="border p-6 rounded bg-gray-50 relative"
      >
        <div className="absolute inset-0 flex items-center justify-center text-4xl font-bold text-gray-300 opacity-40 pointer-events-none">
          PREVIEW ONLY
        </div>
        <h2 className="text-xl font-semibold mb-4">Business Plan Preview</h2>
        <p className="text-gray-700">
          This is a preview of your business plan. Export options are available
          below.
        </p>
      </div>

      <div className="flex gap-4">
        <Button onClick={handleExportPDF}>Export as PDF</Button>
        <Button variant="outline" disabled>
          Export to Google Docs (Coming Soon)
        </Button>
      </div>
    </div>
  );
}
