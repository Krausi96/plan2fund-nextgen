import Link from "next/link";

export default function Preview() {
  return (
    <main className="max-w-3xl mx-auto py-12 space-y-6">
      <h1 className="text-2xl font-bold">Preview Your Business Plan</h1>
      <p className="text-gray-600">
        Here's a preview of your business plan. The content is blurred until
        you finalize your choices.
      </p>

      {/* Blurred Preview of the Plan */}
      <div className="relative">
        <div className="absolute inset-0 bg-black opacity-50 z-10"></div>
        <div className="p-6 bg-gray-50 rounded-xl z-20">
          <h2 className="font-semibold">Executive Summary</h2>
          <p className="text-sm">[Blurred preview of content]</p>
        </div>
      </div>

      {/* Pricing Cards Stub */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
        <div className="p-6 border rounded-xl">
          <h3 className="text-lg font-semibold">Basic Plan</h3>
          <p className="text-sm">Includes basic features and templates.</p>
          <p className="mt-2 font-bold">$99/month</p>
        </div>
        <div className="p-6 border rounded-xl">
          <h3 className="text-lg font-semibold">Pro Plan</h3>
          <p className="text-sm">Includes advanced features and priority support.</p>
          <p className="mt-2 font-bold">$199/month</p>
        </div>
      </div>

      <div className="flex justify-between pt-8">
        <Link href="/review" className="text-blue-600 hover:underline">
          ← Back to Review
        </Link>
        <Link href="/confirmation" className="text-blue-600 hover:underline">
          Continue to Confirm →
        </Link>
      </div>
    </main>
  );
}
