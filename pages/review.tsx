import Breadcrumbs from "@/components/layout/Breadcrumbs";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function ReviewPage() {
  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <Breadcrumbs />

      <h1 className="text-2xl font-bold">Review Your Business Plan</h1>
      <p className="text-gray-600">
        Here is a preview of your draft business plan. You can go back to the
        editor to make changes, or continue to see the formatted preview.
      </p>

      {/* Placeholder for actual plan preview (future: fetch state or context) */}
      <div className="border rounded-lg p-6 bg-white shadow-sm">
        <h2 className="text-lg font-semibold mb-2">Executive Summary</h2>
        <p className="text-sm text-gray-700">
          [Your content from the editor will appear here...]
        </p>
      </div>

      {/* Navigation */}
      <div className="flex justify-between mt-6">
        <Button variant="outline" asChild>
          <Link href="/plan">Back to Editor</Link>
        </Button>
        <Button asChild>
          <Link href="/preview">Continue to Preview →</Link>
        </Button>
      </div>
    </div>
  );
}
