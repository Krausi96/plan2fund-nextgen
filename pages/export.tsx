import Breadcrumbs from "@/components/layout/Breadcrumbs";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { useState } from "react";

export default function ExportPage() {
  const [format, setFormat] = useState<"pdf" | "docx">("pdf");

  const handleExport = () => {
    // Stub export logic
    alert(`Exporting as ${format.toUpperCase()}... (stubbed)`);
  };

  return (
    <div className="max-w-3xl mx-auto p-6 space-y-8">
      <Breadcrumbs />

      <h1 className="text-2xl font-bold">Export Your Plan</h1>
      <p className="text-gray-600">
        Choose your preferred format and download your business plan.
      </p>

      {/* Format Toggle */}
      <div className="flex gap-4">
        <Button
          variant={format === "pdf" ? "default" : "outline"}
          onClick={() => setFormat("pdf")}
        >
          PDF
        </Button>
        <Button
          variant={format === "docx" ? "default" : "outline"}
          onClick={() => setFormat("docx")}
        >
          DOCX
        </Button>
      </div>

      {/* Export Button */}
      <div className="space-y-3">
        <Button onClick={handleExport}>Download {format.toUpperCase()}</Button>
        <p className="text-xs text-gray-500">
          A copy will also be emailed to you for safekeeping.
        </p>
      </div>

      {/* Navigation */}
      <div className="flex justify-between mt-6">
        <Button variant="outline" asChild>
          <Link href="/checkout">Back to Checkout</Link>
        </Button>
        <Button asChild>
          <Link href="/thanks">Finish →</Link>
        </Button>
      </div>
    </div>
  );
}
