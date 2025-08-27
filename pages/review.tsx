import AppShell from "@/components/layout/AppShell";
import Breadcrumbs from "@/components/layout/Breadcrumbs";
import { Card } from "@/components/ui/card";
import Link from "next/link";

export default function ReviewPage() {
  return (
    
      <Breadcrumbs />
      <section className="py-12 max-w-5xl mx-auto">
        <h1 className="text-3xl font-bold mb-6 text-center">Review Your Business Plan</h1>

        <Card className="p-6 shadow-md bg-white">
          <p className="text-gray-700 text-sm mb-4">
            Below is a snapshot of your generated business plan. Review the structure and
            content highlights. You may request edits or proceed directly to preview & pricing.
          </p>
          <div className="h-64 border rounded-md bg-gray-50 flex items-center justify-center text-gray-400">
            [ Document Preview Placeholder ]
          </div>
        </Card>

        <div className="mt-8 flex gap-4 justify-center">
          <button className="px-6 py-3 rounded-lg border border-gray-300 hover:bg-gray-100">
            Request Edits
          </button>
          <Link
            href="/preview"
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Proceed to Preview
          </Link>
        </div>
      </section>
    
  );
}
