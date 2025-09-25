import Link from "next/link";
import { useState, useEffect } from "react";
import featureFlags from "@/lib/featureFlags";
import { loadPlanSections, type PlanSection } from "@/lib/planStore";
import { chapterTemplates } from "@/lib/templates/chapters";
import analytics from "@/lib/analytics";
import { useI18n } from "@/contexts/I18nContext";

export default function Preview() {
  const { t } = useI18n();
  const [sections, setSections] = useState<PlanSection[]>([]);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    const loadedSections = loadPlanSections();
    if (loadedSections.length > 0) {
      setSections(loadedSections);
    } else {
      // Initialize with empty sections if none exist
      const emptySections = chapterTemplates.map(t => ({ id: t.id, title: t.title, content: "" }));
      setSections(emptySections);
    }
    setLoading(false);

    // Track preview view
    analytics.trackSuccessHubView("preview");
  }, []);

  const sectionsFilled = sections.filter(s => s.content && s.content.trim().length > 0).length;
  const totalSections = sections.length;
  const completeness = totalSections > 0 ? Math.round((sectionsFilled / totalSections) * 100) : 0;
  const complexity = sectionsFilled > 6 ? t("preview.complexityHigh") : sectionsFilled > 3 ? t("preview.complexityMedium") : t("preview.complexityLow");
  const basicPrice = "€99";
  const proPrice = "€199";
  const [deliveryMode, setDeliveryMode] = useState<"standard" | "priority">("standard");
  const [includedSections, setIncludedSections] = useState<Set<string>>(new Set(["summary", "problem", "solution"]));
  return (
    <main className="max-w-5xl mx-auto py-12 grid md:grid-cols-[1fr_320px] gap-6">
      <div>
      <h1 className="text-2xl font-bold flex items-center gap-2">Preview Your Business Plan <span className="text-xs px-2 py-1 rounded bg-gray-200">Demo</span></h1>
      <p className="text-gray-600">
        Here's a preview of your business plan. The content is blurred until
        you finalize your choices.
      </p>

      {/* Real Preview of the Plan */}
      <div className="space-y-4">
        {loading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading your business plan...</p>
          </div>
        ) : (
          sections.map((section, i) => {
            const hasContent = section.content && section.content.trim().length > 0;
            const sectionId = section.id;
            return (
              <div key={i} className="relative">
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={includedSections.has(sectionId)}
                      onChange={(e) => {
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
                    <h2 className="font-semibold">{section.title}</h2>
                    {hasContent && <span className="text-xs text-green-600">✓ Completed</span>}
                  </div>
                  <button
                    disabled={!featureFlags.isEnabled('CHECKOUT_ENABLED')}
                    className={`px-3 py-1 text-xs rounded ${
                      featureFlags.isEnabled('CHECKOUT_ENABLED') 
                        ? "bg-blue-100 text-blue-800 hover:bg-blue-200" 
                        : "bg-gray-100 text-gray-400 cursor-not-allowed"
                    }`}
                    title={!featureFlags.isEnabled('CHECKOUT_ENABLED') ? t("preview.unlockAfterPurchase") : ""}
                  >
                    Copy section
                  </button>
                </div>
                <div className="p-6 bg-gray-50 rounded-xl">
                  {hasContent ? (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <p className="text-sm text-gray-600">Preview of your content:</p>
                        <span className="text-xs text-gray-500">{section.content.length} characters</span>
                      </div>
                      <div className="max-h-40 overflow-hidden border rounded p-3 bg-white">
                        <p className="text-sm whitespace-pre-wrap leading-relaxed">{section.content.substring(0, 300)}...</p>
                      </div>
                      <div className="flex gap-2">
                        <button 
                          className="text-xs text-blue-600 hover:text-blue-800"
                          onClick={() => {
                            navigator.clipboard.writeText(section.content);
                            alert('Content copied to clipboard!');
                          }}
                        >
                          📋 Copy Full Content
                        </button>
                        <button 
                          className="text-xs text-gray-600 hover:text-gray-800"
                          onClick={() => window.open('/editor', '_blank')}
                        >
                          ✏️ Edit in Editor
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-4">
                      <p className="text-sm text-gray-500 italic mb-2">No content yet - this section is empty</p>
                      <button 
                        className="text-xs text-blue-600 hover:text-blue-800"
                        onClick={() => window.open('/editor', '_blank')}
                      >
                        ✏️ Start Writing
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
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
        <Link href="/editor" className="text-blue-600 hover:underline">
          ← Back to Editor
        </Link>
        <Link href="/confirm" className="text-blue-600 hover:underline">
          Continue to Confirm →
        </Link>
      </div>
      </div>
      <aside className="space-y-4">
        <div className="p-4 border rounded">
          <h3 className="font-semibold">Completeness</h3>
          <div className="w-full bg-gray-200 h-2 rounded mt-2">
            <div 
              className={`h-2 rounded transition-all duration-300 ${
                completeness >= 80 ? "bg-green-500" : 
                completeness >= 50 ? "bg-orange-500" : "bg-red-500"
              }`} 
              style={{ width: `${completeness}%` }} 
            />
          </div>
          <p className="text-xs mt-2">{completeness}% sections filled ({sectionsFilled}/{totalSections})</p>
          {completeness < 50 && (
            <p className="text-xs text-orange-600 mt-1">💡 Complete more sections for better results</p>
          )}
        </div>
        
        <div className="p-4 border rounded">
          <h3 className="font-semibold">Content Statistics</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span>Total words:</span>
              <span className="font-medium">{sections.reduce((acc, s) => acc + (s.content?.split(' ').length || 0), 0)}</span>
            </div>
            <div className="flex justify-between">
              <span>Characters:</span>
              <span className="font-medium">{sections.reduce((acc, s) => acc + (s.content?.length || 0), 0)}</span>
            </div>
            <div className="flex justify-between">
              <span>Complexity:</span>
              <span className={`font-medium ${
                complexity === t("preview.complexityHigh") ? "text-red-500" : 
                complexity === t("preview.complexityMedium") ? "text-orange-500" : "text-green-600"
              }`}>
                {complexity}
              </span>
            </div>
          </div>
        </div>

        <div className="p-4 border rounded">
          <h3 className="font-semibold">Delivery Options</h3>
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
          <h3 className="font-semibold">Recommended Plan</h3>
          <div className="space-y-2">
            <p className="text-sm">Based on your content:</p>
            <div className={`p-2 rounded text-sm font-medium ${
              complexity === t("preview.complexityHigh") ? "bg-red-50 text-red-700" : 
              complexity === t("preview.complexityMedium") ? "bg-orange-50 text-orange-700" : "bg-green-50 text-green-700"
            }`}>
              {complexity === t("preview.complexityHigh") ? t("preview.proPlan") : 
               complexity === t("preview.complexityMedium") ? t("preview.proPlan") : t("preview.basicPlan")}
            </div>
            <p className="text-xs text-gray-600">
              {complexity === t("preview.complexityHigh") ? t("preview.complexContent") : 
               complexity === t("preview.complexityMedium") ? t("preview.mediumContent") : t("preview.simpleContent")}
            </p>
          </div>
        </div>

        <div className="p-4 border rounded bg-blue-50">
          <h3 className="font-semibold text-blue-800">Quick Actions</h3>
          <div className="space-y-2 mt-2">
            <button 
              className="w-full text-left text-sm text-blue-600 hover:text-blue-800"
              onClick={() => window.open('/editor', '_blank')}
            >
              ✏️ Continue Editing
            </button>
            <button 
              className="w-full text-left text-sm text-blue-600 hover:text-blue-800"
              onClick={() => {
                const allContent = sections.map(s => `# ${s.title}\n\n${s.content || 'No content yet'}`).join('\n\n---\n\n');
                navigator.clipboard.writeText(allContent);
                alert('Full business plan copied to clipboard!');
              }}
            >
              📋 Copy Full Plan
            </button>
          </div>
        </div>
      </aside>
    </main>
  );
}

