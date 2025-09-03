import React, { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function DevNavPage() {
  const [testStates, setTestStates] = useState({
    hasRecoResults: false,
    hasPlanContent: false,
    hasCustomPrograms: false,
    hasSnapshots: false
  });

  const setTestState = (key: string, value: any) => {
    setTestStates(prev => ({ ...prev, [key]: value }));
    
    // Set localStorage for testing (only in browser)
    if (typeof window === 'undefined') return;
    
    switch (key) {
      case "hasRecoResults":
        if (value) {
          localStorage.setItem("recoResults", JSON.stringify({
            recommendations: [
              {
                id: "test-program",
                name: "Test Funding Program",
                type: "Grant",
                score: 85,
                reason: "High fit with your criteria",
                eligibility: "Eligible",
                confidence: "High",
                why: ["Matches your sector", "Within budget range", "Deadline available"]
              }
            ]
          }));
        } else {
          localStorage.removeItem("recoResults");
        }
        break;
      case "hasPlanContent":
        if (value) {
          localStorage.setItem("planDraft", "This is test plan content for development testing.");
          localStorage.setItem("planSections", JSON.stringify([
            { id: "summary", title: "Executive Summary", content: "Test summary content" },
            { id: "problem", title: "Problem", content: "Test problem content" }
          ]));
        } else {
          localStorage.removeItem("planDraft");
          localStorage.removeItem("planSections");
        }
        break;
      case "hasCustomPrograms":
        if (value) {
          const existingResults = JSON.parse(localStorage.getItem("recoResults") || "{}");
          const customProgram = {
            id: "custom-test",
            name: "Custom Test Program",
            type: "Custom Program",
            score: 0,
            reason: "Custom program added via Exploration Mode",
            eligibility: "Unknown",
            confidence: "Low",
            custom: true,
            why: ["Custom program - eligibility not verified"]
          };
          existingResults.recommendations = existingResults.recommendations || [];
          existingResults.recommendations.unshift(customProgram);
          localStorage.setItem("recoResults", JSON.stringify(existingResults));
        }
        break;
      case "hasSnapshots":
        if (value) {
          localStorage.setItem("planSnapshots", JSON.stringify([
            {
              id: Date.now(),
              timestamp: new Date().toISOString(),
              content: "Test snapshot content",
              sections: [{ id: "test", title: "Test Section", content: "Test content" }]
            }
          ]));
        } else {
          localStorage.removeItem("planSnapshots");
        }
        break;
    }
  };

  const clearAllTestData = () => {
    if (typeof window === 'undefined') return;
    
    localStorage.removeItem("recoResults");
    localStorage.removeItem("planDraft");
    localStorage.removeItem("planSections");
    localStorage.removeItem("planSnapshots");
    localStorage.removeItem("freeTextReco");
    setTestStates({
      hasRecoResults: false,
      hasPlanContent: false,
      hasCustomPrograms: false,
      hasSnapshots: false
    });
  };

  const navLinks = [
    { path: "/", label: "Home", description: "Landing page" },
    { path: "/reco", label: "Recommendation Wizard", description: "Survey and free-text input" },
    { path: "/results", label: "Results", description: "Funding recommendations with badges" },
    { path: "/plan/intake", label: "Plan Intake", description: "Plan setup and mode selection" },
    { path: "/plan", label: "Plan Editor", description: "Business plan editor with AI chat" },
    { path: "/preview", label: "Preview", description: "Plan preview with meters and gating" },
    { path: "/pricing", label: "Pricing", description: "Pricing plans and mode selection" },
    { path: "/confirm", label: "Confirm", description: "Order confirmation with email capture" },
    { path: "/thank-you", label: "Thank You", description: "Success hub with revision requests" }
  ];

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">🧪 Development Navigation</h1>
        <p className="text-gray-600">
          Quick navigation and test state management for development and testing.
        </p>
      </div>

      {/* Test State Controls */}
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-8">
        <h2 className="font-semibold mb-3">Test State Controls</h2>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={testStates.hasRecoResults}
                onChange={(e) => setTestState("hasRecoResults", e.target.checked)}
                className="rounded"
              />
              <span className="text-sm">Has Recommendation Results</span>
            </label>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={testStates.hasPlanContent}
                onChange={(e) => setTestState("hasPlanContent", e.target.checked)}
                className="rounded"
              />
              <span className="text-sm">Has Plan Content</span>
            </label>
          </div>
          <div className="space-y-2">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={testStates.hasCustomPrograms}
                onChange={(e) => setTestState("hasCustomPrograms", e.target.checked)}
                className="rounded"
              />
              <span className="text-sm">Has Custom Programs</span>
            </label>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={testStates.hasSnapshots}
                onChange={(e) => setTestState("hasSnapshots", e.target.checked)}
                className="rounded"
              />
              <span className="text-sm">Has Snapshots</span>
            </label>
          </div>
        </div>
        <div className="mt-4">
          <Button
            onClick={clearAllTestData}
            variant="outline"
            size="sm"
            className="text-red-600 border-red-300 hover:bg-red-50"
          >
            Clear All Test Data
          </Button>
        </div>
      </div>

      {/* Navigation Links */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {navLinks.map((link) => (
          <Link
            key={link.path}
            href={link.path}
            className="block p-4 border rounded-lg hover:bg-gray-50 transition-colors"
          >
            <div className="font-medium text-blue-600 mb-1">{link.label}</div>
            <div className="text-sm text-gray-600 mb-2">{link.description}</div>
            <div className="text-xs text-gray-400 font-mono">{link.path}</div>
          </Link>
        ))}
      </div>

      {/* Test Flows */}
      <div className="mt-8">
        <h2 className="font-semibold mb-4">Test Flows</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="border rounded-lg p-4">
            <h3 className="font-medium mb-2">Path A: Reco-first Flow</h3>
            <div className="text-sm text-gray-600 space-y-1">
              <div>1. / → /reco (answer questions)</div>
              <div>2. /results (view recommendations)</div>
              <div>3. /plan/intake → /plan (edit plan)</div>
              <div>4. /preview → /pricing → /confirm → /thank-you</div>
            </div>
            <Button
              asChild
              size="sm"
              className="mt-3"
            >
              <Link href="/reco">Start Path A</Link>
            </Button>
          </div>

          <div className="border rounded-lg p-4">
            <h3 className="font-medium mb-2">Path B: Plan-first Flow</h3>
            <div className="text-sm text-gray-600 space-y-1">
              <div>1. / → /pricing (select mode)</div>
              <div>2. /plan/intake → /plan (edit plan)</div>
              <div>3. /preview → /confirm → /thank-you</div>
            </div>
            <Button
              asChild
              size="sm"
              className="mt-3"
            >
              <Link href="/pricing">Start Path B</Link>
            </Button>
          </div>
        </div>
      </div>

      {/* Feature Flags */}
      <div className="mt-8">
        <h2 className="font-semibold mb-4">Feature Flags</h2>
        <div className="bg-gray-50 border rounded-lg p-4">
          <div className="text-sm space-y-1">
            <div><strong>NEXT_PUBLIC_AI_ENABLED:</strong> {process.env.NEXT_PUBLIC_AI_ENABLED || "false"}</div>
            <div><strong>NEXT_PUBLIC_CHECKOUT_ENABLED:</strong> {process.env.NEXT_PUBLIC_CHECKOUT_ENABLED || "false"}</div>
            <div><strong>NEXT_PUBLIC_EXPORT_ENABLED:</strong> {process.env.NEXT_PUBLIC_EXPORT_ENABLED || "false"}</div>
          </div>
        </div>
      </div>

      {/* Local Storage Status */}
      <div className="mt-8">
        <h2 className="font-semibold mb-4">Local Storage Status</h2>
        <div className="bg-gray-50 border rounded-lg p-4">
          <div className="text-sm space-y-1">
            <div>recoResults: {typeof window !== 'undefined' && localStorage.getItem("recoResults") ? "✅" : "❌"}</div>
            <div>planDraft: {typeof window !== 'undefined' && localStorage.getItem("planDraft") ? "✅" : "❌"}</div>
            <div>planSections: {typeof window !== 'undefined' && localStorage.getItem("planSections") ? "✅" : "❌"}</div>
            <div>planSnapshots: {typeof window !== 'undefined' && localStorage.getItem("planSnapshots") ? "✅" : "❌"}</div>
            <div>freeTextReco: {typeof window !== 'undefined' && localStorage.getItem("freeTextReco") ? "✅" : "❌"}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
