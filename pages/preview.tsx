import Link from "next/link";
import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/router";
import { isFeatureEnabled, getSubscriptionTier } from "@/shared/user/featureFlags";
import { loadPlanSections, type PlanSection } from "@/shared/user/storage/planStore";
// chapters.ts removed - use unified template system instead
import analytics from "@/shared/user/analytics";
import { useI18n } from "@/shared/contexts/I18nContext";
import { Switch } from "@/shared/components/ui/switch";
import { Label } from "@/shared/components/ui/label";
import ExportRenderer from "@/features/editor/components/preview/DocumentRenderer";
import { getDocuments } from "@templates";
import { withAuth } from "@/shared/user/auth/withAuth";
import { useUser } from "@/shared/user/context/UserContext";
import PageEntryIndicator from '@/shared/components/common/PageEntryIndicator';
import { CheckCircle, FileText, Copy, Lightbulb, Edit } from "lucide-react";

function Preview() {
  const { t } = useI18n();
  const router = useRouter();
  const { userProfile } = useUser();
  const subscriptionTier = getSubscriptionTier(userProfile);
  const [sections, setSections] = useState<PlanSection[]>([]);
  const [loading, setLoading] = useState(true);
  const [additionalDocuments, setAdditionalDocuments] = useState<any[]>([]);
  const [product] = useState<string>('submission');
  const [route] = useState<string>('grants');

  const loadAdditionalDocuments = useCallback(async () => {
    try {
      const { programId } = router.query as { programId?: string };
      const productType = product || 'submission';
      const fundingType = route || 'grants';

      const docs = await getDocuments(fundingType, productType, programId);

      const documents = docs.map(doc => ({
        id: doc.id,
        title: doc.name,
        description: doc.description || '',
        format: doc.format.toUpperCase(),
        status: 'ready'
      }));

      setAdditionalDocuments(documents);
    } catch (error) {
      console.error('Error loading additional documents:', error);
      setAdditionalDocuments([]);
    }
  }, [router.query, product, route]);
  
  // Get or create plan ID
  const planId = router.query.planId as string || (userProfile ? `plan_${Date.now()}` : 'current');
  
  useEffect(() => {
    const loadedSections = loadPlanSections();
    if (loadedSections.length > 0) {
      setSections(loadedSections);
    } else {
      // Initialize with empty sections if none exist
      // Use unified sections as fallback instead of legacy chapters
      const emptySections: PlanSection[] = [];
      setSections(emptySections);
    }
    setLoading(false);

    // Load additional documents based on product/route and program if available
    loadAdditionalDocuments();
    const { programId } = router.query as { programId?: string };
    if (programId) {
      fetch(`/api/programs/${programId}/requirements`).then(r => r.ok ? r.json() : null).then((data) => {
        if (data && Array.isArray(data.additionalDocuments)) {
          setAdditionalDocuments((prev) => mergeDocs(prev, data.additionalDocuments));
        }
      }).catch(() => {});
    }

    // Track preview view
    analytics.trackSuccessHubView("preview");
  }, [router.query, loadAdditionalDocuments]);

  function mergeDocs(staticDocs: any[], programDocs: any[]) {
    const byId: Record<string, any> = {};
    [...programDocs, ...staticDocs].forEach(d => { if (!byId[d.id]) byId[d.id] = d; else byId[d.id] = { ...byId[d.id], ...d }; });
    return Object.values(byId);
  }

  const sectionsFilled = sections.filter(s => s.content && s.content.trim().length > 0).length;
  const totalSections = sections.length;
  const completeness = totalSections > 0 ? Math.round((sectionsFilled / totalSections) * 100) : 0;
  const complexity = sectionsFilled > 6 ? t("preview.complexityHigh") : sectionsFilled > 3 ? t("preview.complexityMedium") : t("preview.complexityLow");
  const basicPrice = "€99";
  const proPrice = "€199";
  const [deliveryMode, setDeliveryMode] = useState<"standard" | "priority">("standard");
  const [includedSections, setIncludedSections] = useState<Set<string>>(new Set(["summary", "problem", "solution"]));
  const [showWatermark, setShowWatermark] = useState(true);
  const [watermarkText, setWatermarkText] = useState("DRAFT");
  const [previewMode, setPreviewMode] = useState<"preview" | "formatted" | "print">("preview");
  const [formattingOptions, setFormattingOptions] = useState({
    theme: "sans",
    fontSize: "medium",
    spacing: "normal",
    showPageNumbers: true,
    showTableOfContents: true
  });

  // Read live settings from localStorage when available
  useEffect(() => {
    const loadSettings = async () => {
      try {
        // Use appStore as single source of truth
        const { loadPlanSettings } = await import('@/shared/user/storage/planStore');
        const ps = loadPlanSettings();
        if (ps && Object.keys(ps).length > 0) {
          setFormattingOptions(prev => ({
            ...prev,
            theme: (ps as any).theme === 'serif' ? 'serif' : 'sans',
            fontSize: ps.fontSize ? (ps.fontSize >= 16 ? 'large' : ps.fontSize <= 12 ? 'small' : 'medium') : 'medium',
            spacing: (ps as any).spacing ? ((ps as any).spacing <= 1.5 ? 'compact' : (ps as any).spacing >= 1.8 ? 'relaxed' : 'normal') : 'normal',
            showPageNumbers: !!ps.showPageNumbers,
            showTableOfContents: !!ps.showTableOfContents
          }));
        }
      } catch {}
    };
    loadSettings();
  }, []);
  const [selectedSections] = useState<Set<string>>(new Set());
  const [previewSettings, setPreviewSettings] = useState({
    showWordCount: true,
    showCharacterCount: true,
    showCompletionStatus: true,
    enableRealTimePreview: true
  });
  const [useExportRenderer, setUseExportRenderer] = useState(false);
  return (
    <>
      <PageEntryIndicator 
        icon="info"
        translationKey="preview"
        duration={0}
      />
      <main className="max-w-5xl mx-auto py-12 grid md:grid-cols-[1fr_320px] gap-6">
      <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">Preview Your Business Plan <span className="text-xs px-2 py-1 rounded bg-gray-200">Demo</span></h1>
          <p className="text-gray-600">
            Here's a preview of your business plan. The content is blurred until
            you finalize your choices.
          </p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Label htmlFor="watermark-toggle" className="text-sm">Watermark</Label>
            <Switch
              checked={showWatermark}
              onCheckedChange={setShowWatermark}
            />
          </div>
          {showWatermark && (
            <div className="flex items-center gap-2">
              <Label htmlFor="watermark-text" className="text-sm">Text</Label>
              <input
                id="watermark-text"
                type="text"
                value={watermarkText}
                onChange={(e) => setWatermarkText(e.target.value)}
                className="px-2 py-1 border border-gray-300 rounded text-sm w-20"
                maxLength={10}
              />
            </div>
          )}
          <div className="flex items-center gap-2">
            <Label htmlFor="preview-mode" className="text-sm">Mode</Label>
            <select
              id="preview-mode"
              value={previewMode}
              onChange={(e) => setPreviewMode(e.target.value as "preview" | "formatted" | "print")}
              className="px-3 py-1 border border-gray-300 rounded-md text-sm"
            >
              <option value="preview">Preview</option>
              <option value="formatted">Formatted</option>
              <option value="print">Print View</option>
            </select>
          </div>
          <div className="flex items-center gap-2">
            <Label htmlFor="real-time-toggle" className="text-sm">Real-time</Label>
            <Switch
              checked={previewSettings.enableRealTimePreview}
              onCheckedChange={(checked) => setPreviewSettings(prev => ({ ...prev, enableRealTimePreview: checked }))}
            />
          </div>
          <div className="flex items-center gap-2">
            <Label htmlFor="export-renderer-toggle" className="text-sm">Export View</Label>
            <Switch
              checked={useExportRenderer}
              onCheckedChange={setUseExportRenderer}
            />
          </div>
        </div>
      </div>

      {/* Additional Preview Settings */}
      {!useExportRenderer && (
        <div className="bg-gray-50 rounded-lg p-4">
          <h3 className="text-sm font-medium text-gray-700 mb-3">Preview Settings</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <label className="flex items-center space-x-2 text-sm">
              <input
                type="checkbox"
                checked={previewSettings.showWordCount}
                onChange={(e) => setPreviewSettings(prev => ({ ...prev, showWordCount: e.target.checked }))}
                className="rounded border-gray-300"
              />
              <span>Word Count</span>
            </label>
            <label className="flex items-center space-x-2 text-sm">
              <input
                type="checkbox"
                checked={previewSettings.showCharacterCount}
                onChange={(e) => setPreviewSettings(prev => ({ ...prev, showCharacterCount: e.target.checked }))}
                className="rounded border-gray-300"
              />
              <span>Character Count</span>
            </label>
            <label className="flex items-center space-x-2 text-sm">
              <input
                type="checkbox"
                checked={previewSettings.showCompletionStatus}
                onChange={(e) => setPreviewSettings(prev => ({ ...prev, showCompletionStatus: e.target.checked }))}
                className="rounded border-gray-300"
              />
              <span>Completion Status</span>
            </label>
          </div>
        </div>
      )}

      {/* Real Preview of the Plan */}
      <div className="space-y-4">
        {loading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading your business plan...</p>
          </div>
        ) : useExportRenderer ? (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
            <ExportRenderer
              plan={{
                id: "preview_plan",
                ownerId: "user",
                product: "submission" as const,
                route: "grant" as const,
                language: "en" as const,
                tone: "neutral" as const,
                targetLength: "standard" as const,
                settings: {
                  includeTitlePage: true,
                  includePageNumbers: true,
                  citations: "simple" as const,
                  captions: true,
                  graphs: {
                    revenueCosts: true,
                    cashflow: true,
                    useOfFunds: true
                  }
                },
                sections: sections.map(section => ({
                  key: section.id,
                  title: section.title,
                  content: section.content,
                  status: "missing" as const,
                  tables: (section as any).tables,
                  chartTypes: (section as any).chartTypes, // Include chart types
                  figures: (section as any).figures
                })),
                addonPack: false,
                versions: []
              }}
              showWatermark={showWatermark}
              watermarkText={watermarkText}
              previewMode={previewMode}
              selectedSections={selectedSections.size > 0 ? selectedSections : undefined}
              previewSettings={previewSettings}
              // Pass formatting through via props mapping
              // ExportRenderer will interpret theme/font/spacing
              // We propagate with Preview options as state
            />
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
                    {hasContent && (
                      <span className="text-xs text-green-600 flex items-center gap-1">
                        <CheckCircle className="w-3 h-3" />
                        Completed
                      </span>
                    )}
                  </div>
                  <button
                    disabled={!isFeatureEnabled('priority_support' as any, subscriptionTier)}
                    className={`px-3 py-1 text-xs rounded ${
                      isFeatureEnabled('priority_support' as any, subscriptionTier) 
                        ? "bg-blue-100 text-blue-800 hover:bg-blue-200" 
                        : "bg-gray-100 text-gray-400 cursor-not-allowed"
                    }`}
                    title={!isFeatureEnabled('priority_support' as any, subscriptionTier) ? t("preview.unlockAfterPurchase") : ""}
                  >
                    Copy section
                  </button>
                </div>
                <div className="p-6 bg-gray-50 rounded-xl relative">
                  {showWatermark && (
                    <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                      <div className="text-6xl font-bold text-gray-200 opacity-30 transform -rotate-45 select-none">
                        {watermarkText}
                      </div>
                    </div>
                  )}
                  {hasContent ? (
                    <div className="space-y-3 relative z-10">
                      <div className="flex items-center justify-between">
                        <p className="text-sm text-gray-600">Preview of your content:</p>
                        <span className="text-xs text-gray-500">{section.content.length} characters</span>
                      </div>
                      <div className={`max-h-40 overflow-hidden border rounded p-3 bg-white ${
                        previewMode === "formatted" ? "font-serif" : ""
                      }`}>
                        <p className={`text-sm whitespace-pre-wrap leading-relaxed ${
                          formattingOptions.fontSize === "small" ? "text-xs" :
                          formattingOptions.fontSize === "large" ? "text-base" : "text-sm"
                        }`}>
                          {section.content.substring(0, 300)}...
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <button 
                          className="text-xs text-blue-600 hover:text-blue-800"
                          onClick={() => {
                            navigator.clipboard.writeText(section.content);
                            alert('Content copied to clipboard!');
                          }}
                        >
                          <Copy className="w-3 h-3 inline mr-1" />
                          Copy Full Content
                        </button>
                        <button 
                          className="text-xs text-gray-600 hover:text-gray-800"
                          onClick={() => window.open('/editor', '_blank')}
                        >
                          <Edit className="w-3 h-3 inline mr-1" />
                          Edit in Editor
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
                        <Edit className="w-3 h-3 inline mr-1" />
                        Start Writing
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Additional Documents Section */}
      {additionalDocuments.length > 0 && (
        <div className="mt-8 p-6 border rounded-xl bg-blue-50">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <FileText className="w-5 h-5 text-blue-600" />
            Additional Documents
            <span className="text-sm text-gray-600">({additionalDocuments.length} documents)</span>
          </h3>
          <p className="text-sm text-gray-600 mb-4">
            Based on your selection of <strong>{product}</strong> product and <strong>{route}</strong> funding type, 
            the following additional documents will be generated:
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {additionalDocuments.map((doc, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-white rounded-lg border">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                    <CheckCircle className="w-4 h-4 text-green-600" />
                  </div>
                  <div>
                    <div className="font-medium text-sm">{doc.title}</div>
                    <div className="text-xs text-gray-500">{doc.description}</div>
                  </div>
                </div>
                <div className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                  {doc.format}
                </div>
              </div>
            ))}
          </div>
          <div className="mt-4 text-xs text-gray-600">
            <div className="flex items-start gap-2">
              <Lightbulb className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
              <span>These documents will be automatically generated based on your business plan content and included in your final export package.</span>
            </div>
          </div>
        </div>
      )}

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
        <Link href="/editor?restore=true" className="text-blue-600 hover:underline">
          ← Back to Editor
        </Link>
        <div className="flex gap-3">
          <button
            onClick={() => {
              const { programId } = router.query;
              router.push(`/export?programId=${programId || ''}`);
            }}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-sm hover:shadow-md"
          >
            <FileText className="w-4 h-4 inline mr-1" />
            Export Plan
          </button>
          <Link href="/confirm" className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors text-center">
          Continue to Confirm →
        </Link>
        </div>
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
            <p className="text-xs text-orange-600 mt-1 flex items-center gap-1">
              <Lightbulb className="w-3 h-3" />
              Complete more sections for better results
            </p>
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

        <div className="p-4 border rounded">
          <h3 className="font-semibold mb-3">Formatting Options</h3>
          <div className="space-y-3">
            <div>
              <Label className="text-xs text-gray-600 mb-1">Theme</Label>
              <select
                value={formattingOptions.theme}
                onChange={(e) => setFormattingOptions(prev => ({ ...prev, theme: e.target.value }))}
                className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
              >
                <option value="sans">Sans Serif</option>
                <option value="serif">Serif</option>
                <option value="modern">Modern</option>
                <option value="classic">Classic</option>
              </select>
            </div>
            <div>
              <Label className="text-xs text-gray-600 mb-1">Font Size</Label>
              <select
                value={formattingOptions.fontSize}
                onChange={(e) => setFormattingOptions(prev => ({ ...prev, fontSize: e.target.value }))}
                className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
              >
                <option value="small">Small</option>
                <option value="medium">Medium</option>
                <option value="large">Large</option>
              </select>
            </div>
            <div>
              <Label className="text-xs text-gray-600 mb-1">Spacing</Label>
              <select
                value={formattingOptions.spacing}
                onChange={(e) => setFormattingOptions(prev => ({ ...prev, spacing: e.target.value }))}
                className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
              >
                <option value="compact">Compact</option>
                <option value="normal">Normal</option>
                <option value="relaxed">Relaxed</option>
              </select>
            </div>
            <div className="flex items-center justify-between">
              <Label className="text-xs text-gray-600">Page Numbers</Label>
              <Switch
                checked={formattingOptions.showPageNumbers}
                onCheckedChange={(checked) => setFormattingOptions(prev => ({ ...prev, showPageNumbers: checked }))}
              />
            </div>
            <div className="flex items-center justify-between">
              <Label className="text-xs text-gray-600">Table of Contents</Label>
              <Switch
                checked={formattingOptions.showTableOfContents}
                onCheckedChange={(checked) => setFormattingOptions(prev => ({ ...prev, showTableOfContents: checked }))}
              />
            </div>
          </div>
        </div>

        <div className="p-4 border rounded bg-blue-50">
          <h3 className="font-semibold text-blue-800">Quick Actions</h3>
          <div className="space-y-2 mt-2">
            <button 
              className="w-full text-left text-sm text-blue-600 hover:text-blue-800"
              onClick={() => window.open('/editor', '_blank')}
            >
              <Edit className="w-3 h-3 inline mr-1" />
              Continue Editing
            </button>
            <button 
              className="w-full text-left text-sm text-blue-600 hover:text-blue-800"
              onClick={() => {
                const allContent = sections.map(s => `# ${s.title}\n\n${s.content || 'No content yet'}`).join('\n\n---\n\n');
                navigator.clipboard.writeText(allContent);
                alert('Full business plan copied to clipboard!');
              }}
            >
              <Copy className="w-4 h-4 inline mr-1" />
              Copy Full Plan
            </button>
          </div>
        </div>

        {/* Continue to Checkout */}
        <div className="p-4 border rounded-lg bg-gradient-to-r from-blue-600 to-purple-600 text-white">
          <h3 className="font-semibold mb-2">Ready to Export?</h3>
          <p className="text-sm mb-4 opacity-90">
            Get your professional business plan and additional documents.
          </p>
          <Link 
            href={`/checkout?planId=${planId}&product=${product}&route=${route}`}
            className="block w-full text-center px-4 py-2 bg-white text-blue-600 rounded-lg font-medium hover:bg-gray-100 transition-colors"
            onClick={() => analytics.trackUserAction('preview_continue_to_checkout', { planId, product, route })}
          >
            Continue to Checkout →
          </Link>
        </div>
      </aside>
    </main>
    </>
  );
}

export default withAuth(Preview);

