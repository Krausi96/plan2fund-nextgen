import Link from "next/link";
import { useState } from "react";
import { featureFlags } from "@/lib/utils";

export default function Preview() {
  const sectionsFilled = 3 // stub: could read from planStore
  const totalSections = 9
  const completeness = Math.round((sectionsFilled / totalSections) * 100)
  const complexity = sectionsFilled > 6 ? "High" : sectionsFilled > 3 ? "Medium" : "Low"
  const basicPrice = "€99"
  const proPrice = "€199"
  const [deliveryMode, setDeliveryMode] = useState<"standard" | "priority">("standard")
  const [includedSections, setIncludedSections] = useState<Set<string>>(new Set(["summary", "problem", "solution"]))
  return (
    <main className="max-w-5xl mx-auto py-12 grid md:grid-cols-[1fr_320px] gap-6">
      <div>
      <h1 className="text-2xl font-bold flex items-center gap-2">Preview Your Business Plan <span className="text-xs px-2 py-1 rounded bg-gray-200">Demo</span></h1>
      <p className="text-gray-600">
        Here's a preview of your business plan. The content is blurred until
        you finalize your choices.
      </p>

      {/* Blurred Preview of the Plan */}
      <div className="space-y-4">
        {["Executive Summary", "Problem Statement", "Solution", "Market Analysis", "Financial Projections"].map((section, i) => (
          <div key={i} className="relative">
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={includedSections.has(section.toLowerCase().replace(/\s+/g, "-"))}
                  onChange={(e) => {
                    const sectionId = section.toLowerCase().replace(/\s+/g, "-");
                    const newIncluded = new Set(includedSections);
                    if (e.target.checked) {
                      newIncluded.add(sectionId);
                    } else {
                      newIncluded.delete(sectionId);
                    }
                    setIncludedSections(newIncluded);
                  }}
                  className="rounded"
                />
                <h2 className="font-semibold">{section}</h2>
              </div>
              <button
                disabled={!featureFlags.CHECKOUT_ENABLED}
                className={`px-3 py-1 text-xs rounded ${
                  featureFlags.CHECKOUT_ENABLED 
                    ? "bg-blue-100 text-blue-800 hover:bg-blue-200" 
                    : "bg-gray-100 text-gray-400 cursor-not-allowed"
                }`}
                title={!featureFlags.CHECKOUT_ENABLED ? "Unlock after purchase" : ""}
              >
                Copy section
              </button>
            </div>
            <div className="absolute inset-0 bg-black opacity-50 z-10 rounded-xl"></div>
            <div className="p-6 bg-gray-50 rounded-xl z-20 relative">
              <p className="text-sm">[Blurred preview of content]</p>
            </div>
          </div>
        ))}
      </div>

      {/* Pricing Cards Stub */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
        <div className="p-6 border rounded-xl">
          <h3 className="text-lg font-semibold">Basic Plan</h3>
          <p className="text-sm">Includes basic features and templates.</p>
          <p className="mt-2 font-bold">{basicPrice}</p>
        </div>
        <div className="p-6 border rounded-xl">
          <h3 className="text-lg font-semibold">Pro Plan</h3>
          <p className="text-sm">Includes advanced features and priority support.</p>
          <p className="mt-2 font-bold">{proPrice}</p>
        </div>
      </div>

      <div className="flex justify-between pt-8">
        <Link href="/plan" className="text-blue-600 hover:underline">
          ← Back to Plan
        </Link>
        <Link href="/pricing" className="text-blue-600 hover:underline">
          Continue to Pricing →
        </Link>
      </div>
      </div>
      <aside className="space-y-4">
        <div className="p-4 border rounded">
          <h3 className="font-semibold">Completeness</h3>
          <div className="w-full bg-gray-200 h-2 rounded mt-2">
            <div 
              className={`h-2 rounded ${
                completeness >= 80 ? "bg-green-500" : 
                completeness >= 50 ? "bg-orange-500" : "bg-red-500"
              }`} 
              style={{ width: `${completeness}%` }} 
            />
          </div>
          <p className="text-xs mt-2">{completeness}% sections filled</p>
        </div>
        <div className="p-4 border rounded">
          <h3 className="font-semibold">Complexity</h3>
          <p className={`text-sm font-medium ${
            complexity === "High" ? "text-red-500" : 
            complexity === "Medium" ? "text-orange-500" : "text-green-600"
          }`}>
            {complexity}
          </p>
        </div>
        <div className="p-4 border rounded">
          <h3 className="font-semibold">Delivery</h3>
          <div className="space-y-2">
            <label className="flex items-center gap-2">
              <input
                type="radio"
                name="delivery"
                checked={deliveryMode === "standard"}
                onChange={() => setDeliveryMode("standard")}
                className="rounded"
              />
              <span className="text-sm">Standard (3-5 days)</span>
            </label>
            <label className="flex items-center gap-2">
              <input
                type="radio"
                name="delivery"
                checked={deliveryMode === "priority"}
                onChange={() => setDeliveryMode("priority")}
                className="rounded"
              />
              <span className="text-sm">Priority (24-48 hours)</span>
            </label>
          </div>
        </div>
        <div className="p-4 border rounded">
          <h3 className="font-semibold">Suggested Pricing</h3>
          <p className="text-sm">Based on completeness and complexity, we suggest Pro.</p>
        </div>
      </aside>
    </main>
  );
}

