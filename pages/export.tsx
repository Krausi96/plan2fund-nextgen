import { useState } from "react";
import Link from "next/link";
import featureFlags from "@/lib/featureFlags";

export default function Export() {
  const EXPORT_ENABLED = featureFlags.isEnabled('EXPORT_ENABLED')
  if (!EXPORT_ENABLED) {
    return (
      <main className="max-w-3xl mx-auto py-12 space-y-6">
        <h1 className="text-2xl font-bold">Export</h1>
        <p className="text-gray-600">Export is currently unavailable.</p>
        <div className="flex justify-between pt-8">
          <Link href="/checkout" className="text-blue-600 hover:underline">← Back to Checkout</Link>
          <Link href="/thank-you" className="text-blue-600 hover:underline">Continue to Success Hub →</Link>
        </div>
      </main>
    )
  }
  const [format, setFormat] = useState<"pdf" | "docx">("pdf");
  const isPaid = false; // stubbed payment state

  return (
    <main className="max-w-3xl mx-auto py-12 space-y-6">
      <h1 className="text-2xl font-bold">Export</h1>
      <p className="text-gray-600">
        Download your business plan as PDF or DOCX.
      </p>

      {/* Export format toggle */}
      <div className="flex gap-6 items-center">
        <label className="flex items-center gap-2">
          <input
            type="radio"
            checked={format === "pdf"}
            onChange={() => setFormat("pdf")}
          />
          PDF
        </label>
        <label className="flex items-center gap-2">
          <input
            type="radio"
            checked={format === "docx"}
            onChange={() => setFormat("docx")}
          />
          DOCX
        </label>
      </div>

      {/* Download stub */}
      <button className="px-6 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700">
        Download {format.toUpperCase()} (Stub)
      </button>

      {/* Watermark stub if unpaid */}
      {!isPaid && (
        <div className="mt-6 p-4 border rounded-lg bg-gray-100 text-sm text-gray-600">
          ⚠️ Unpaid version – Export will include watermark until payment is
          completed.
        </div>
      )}

      {/* Navigation */}
      <div className="flex justify-between pt-8">
        <Link
          href="/checkout"
          className="px-4 py-2 rounded-lg bg-gray-200 hover:bg-gray-300"
        >
          ← Back to Checkout
        </Link>
        <Link
          href="/thank-you"
          className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700"
        >
          Continue to Success Hub →
        </Link>
      </div>
    </main>
  );
}

