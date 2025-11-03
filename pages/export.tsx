import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import featureFlags from "@/shared/lib/featureFlags";
import { loadPlanSections, type PlanSection } from "@/shared/lib/planStore";
import analytics from "@/shared/lib/analytics";
import { getDocuments } from "@/shared/lib/templates";
import { exportManager } from "@/features/export/engine/export";

export default function Export() {
  const EXPORT_ENABLED = featureFlags.isEnabled('EXPORT_ENABLED')
  const router = useRouter();
  const [sections, setSections] = useState<PlanSection[]>([]);
  const [exporting, setExporting] = useState(false);
  const [format, setFormat] = useState<"pdf" | "docx">("pdf");
  const isPaid = false; // stubbed payment state
  const [additionalDocuments, setAdditionalDocuments] = useState<any[]>([]);
  const [product] = useState<string>('submission');
  const [route] = useState<string>('grants');
  const [includePlan, setIncludePlan] = useState(true);
  const [selectedDocs, setSelectedDocs] = useState<Set<string>>(new Set());
  const [addonOnePager, setAddonOnePager] = useState(false);
  const [addonSubmissionPack, setAddonSubmissionPack] = useState(false);
  const [addonPitchDeck, setAddonPitchDeck] = useState(false); // stub toggle for later
  const [addonTeamCVs, setAddonTeamCVs] = useState(false); // stub toggle for later
  
  // Load plan sections and additional documents
  React.useEffect(() => {
    const loadedSections = loadPlanSections();
    setSections(loadedSections);
    
    // Load additional documents
    loadAdditionalDocuments();
    const { programId } = router.query as { programId?: string };
    if (programId) {
      fetch(`/api/programmes/${programId}/requirements`).then(r => r.ok ? r.json() : null).then((data) => {
        if (data && Array.isArray(data.additionalDocuments)) {
          setAdditionalDocuments((prev) => mergeDocs(prev, data.additionalDocuments));
        }
      }).catch(() => {});
    }
    
    // Track export page view
    analytics.trackEvent({ 
      event: 'export_page_view', 
      properties: { sections_count: loadedSections.length } 
    });
  }, [router.query]);

  const loadAdditionalDocuments = async () => {
    try {
      // Use unified template system
      const { programId } = router.query as { programId?: string };
      const productType = product || 'submission';
      const fundingType = route || 'grants';
      
      const docs = await getDocuments(fundingType, productType, programId);
      
      // Convert to export format
      const documents = docs.map(doc => ({
        id: doc.id,
        title: doc.name,
        description: doc.description || '',
        format: doc.format.toUpperCase(),
        status: 'ready'
      }));
      
      setAdditionalDocuments(documents);
      // auto-select all by default
      setSelectedDocs(new Set(documents.map((d: any) => d.id)));
    } catch (error) {
      console.error('Error loading additional documents:', error);
      setAdditionalDocuments([]);
    }
  };

  function mergeDocs(staticDocs: any[], programDocs: any[]) {
    const byId: Record<string, any> = {};
    [...programDocs, ...staticDocs].forEach(d => { if (!byId[d.id]) byId[d.id] = d; else byId[d.id] = { ...byId[d.id], ...d }; });
    return Object.values(byId);
  }

  // Helpers for separate downloads
  function sanitizeFilename(name: string) {
    return name.replace(/[^a-z0-9\-_]+/gi, '_').toLowerCase();
  }

  async function generateSimplePdf(_title: string, htmlBody: string, filename: string) {
    const html2pdf = (await import('html2pdf.js')).default;
    const element = document.createElement('div');
    element.innerHTML = `
      <div style="font-family:Arial, sans-serif; max-width:800px; margin:24px auto;">
        ${htmlBody}
      </div>
    `;
    document.body.appendChild(element);
    const opt = {
      margin: 0.5,
      filename,
      image: { type: 'jpeg' as const, quality: 0.98 },
      html2canvas: { scale: 2 },
      jsPDF: { unit: 'in', format: 'letter', orientation: 'portrait' as const }
    };
    await html2pdf().set(opt).from(element).save();
    document.body.removeChild(element);
  }

  function buildOnePager(secs: PlanSection[]) {
    const filled = secs.filter(s => (s.content || '').trim().length > 0);
    const head = `<h1 style='font-family:Arial;margin:0 0 10px 0;'>Business Plan – One-pager</h1>`;
    const blocks = filled.slice(0, 5).map(s => `
      <div style='margin:12px 0;'>
        <h2 style='font-family:Arial;margin:0 0 6px 0;font-size:18px;'>${s.title}</h2>
        <div style='font-family:Arial;color:#374151;line-height:1.6;'>${(s.content || '').substring(0, 600)}${(s.content || '').length > 600 ? '…' : ''}</div>
      </div>
    `).join('');
    return `${head}${blocks}`;
  }

  function buildSubmissionPack(secs: PlanSection[], docs: any[]) {
    const now = new Date().toLocaleDateString();
    const exec = secs.find(s => /executive/i.test(s.title)) || secs[0];
    const summary = exec ? (exec.content || '').substring(0, 1000) : '';
    const fin = secs.find(s => /financial/i.test(s.title) || (s as any).tables?.financials);
    const finTable = fin && (fin as any).tables?.financials;

    const checklistItems = [
      'All required sections completed',
      'Financial projections included',
      'Supporting documents attached',
      'Proofread for errors',
      'Formatting consistent'
    ];

    const checklist = checklistItems.map((item) => `
      <div style='display:flex;align-items:center;margin:4px 0;'>
        <span style='display:inline-block;width:14px;height:14px;border:1px solid #d1d5db;border-radius:3px;margin-right:8px;'></span>
        <span>${item}</span>
      </div>
    `).join('');

    const finHtml = finTable ? `
      <table style='width:100%;border-collapse:collapse;margin-top:8px;font-size:12px;'>
        <thead>
          <tr>
            <th style='text-align:left;border:1px solid #e5e7eb;padding:6px;'>Item</th>
            ${finTable.columns.map((c: string)=>`<th style='text-align:right;border:1px solid #e5e7eb;padding:6px;'>${c}</th>`).join('')}
          </tr>
        </thead>
        <tbody>
          ${finTable.rows.map((r: any)=>`
            <tr>
              <td style='border:1px solid #e5e7eb;padding:6px;'>${r.label}</td>
              ${r.values.map((v: number)=>`<td style='text-align:right;border:1px solid #e5e7eb;padding:6px;'>${v}</td>`).join('')}
            </tr>
          `).join('')}
        </tbody>
      </table>
    ` : '<p style="color:#6b7280;font-size:12px;margin-top:8px;">No financial table available</p>';

    const docsHtml = docs.length ? `
      <ul style='margin:6px 0 0 18px;'>
        ${docs.map(d => `<li>${d.title}</li>`).join('')}
      </ul>
    ` : '<p style="color:#6b7280;font-size:12px;margin-top:8px;">No additional documents selected</p>';

    return `
      <div style='font-family:Arial,sans-serif;'>
        <div style='text-align:center;padding:24px 0;border-bottom:2px solid #2563eb;margin-bottom:16px;'>
          <div style='font-size:24px;font-weight:700;color:#1f2937;'>Submission Pack</div>
          <div style='font-size:12px;color:#6b7280;'>Generated: ${now}</div>
        </div>

        <div style='margin-bottom:16px;'>
          <div style='font-weight:600;margin-bottom:6px;'>Pre-submission checklist</div>
          ${checklist}
        </div>

        <div style='margin-bottom:16px;'>
          <div style='font-weight:600;margin-bottom:6px;'>Executive summary (short)</div>
          <div style='color:#374151;line-height:1.6;'>${summary}</div>
        </div>

        <div style='margin-bottom:16px;'>
          <div style='font-weight:600;margin-bottom:6px;'>Financial snapshot</div>
          ${finHtml}
        </div>

        <div style='margin-bottom:16px;'>
          <div style='font-weight:600;margin-bottom:6px;'>Included additional documents</div>
          ${docsHtml}
        </div>
      </div>
    `;
  }

  if (!EXPORT_ENABLED) {
    return (
      <main className="max-w-3xl mx-auto py-12 space-y-6">
        <h1 className="text-2xl font-bold">Export</h1>
        <p className="text-gray-600">Export is currently unavailable.</p>
        <div className="flex justify-between pt-8">
          <Link href="/confirm" className="text-blue-600 hover:underline">← Back to Payment</Link>
          <Link href="/thank-you" className="text-blue-600 hover:underline">Continue to Success Hub →</Link>
        </div>
      </main>
    )
  }

  return (
    <main className="max-w-3xl mx-auto py-12 space-y-6">
      <h1 className="text-2xl font-bold">Export</h1>
      <p className="text-gray-600">
        Download your business plan as PDF or DOCX.
      </p>

      {/* Selection controls */}
      <div className="p-4 border rounded-lg bg-white space-y-3">
        <div className="font-semibold">What to export</div>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={includePlan} onChange={(e)=>setIncludePlan(e.target.checked)} disabled />
          Main plan (always included)
        </label>
        {additionalDocuments.length > 0 && (
          <div className="mt-2">
            <div className="text-sm font-medium mb-2">Additional documents</div>
            <div className="space-y-1">
              {additionalDocuments.map((doc) => (
                <label key={doc.id} className="flex items-center justify-between gap-2 text-sm">
                  <span className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={selectedDocs.has(doc.id)}
                      onChange={(e) => {
                        const next = new Set(selectedDocs);
                        if (e.target.checked) next.add(doc.id); else next.delete(doc.id);
                        setSelectedDocs(next);
                      }}
                    />
                    <span>{doc.title}</span>
                  </span>
                  <span className="text-xs text-gray-500">{doc.format}</span>
                </label>
              ))}
            </div>
          </div>
        )}

        <div className="mt-2">
          <div className="text-sm font-medium mb-2">Add-ons</div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
            <label className="flex items-center gap-2">
              <input type="checkbox" checked={addonOnePager} onChange={(e)=>setAddonOnePager(e.target.checked)} />
              One-pager (condensed summary)
            </label>
            <label className="flex items-center gap-2">
              <input type="checkbox" checked={addonSubmissionPack} onChange={(e)=>setAddonSubmissionPack(e.target.checked)} />
              Submission pack (cover, checklist, snapshot)
            </label>
            <label className="flex items-center gap-2 opacity-60">
              <input type="checkbox" checked={addonPitchDeck} onChange={(e)=>setAddonPitchDeck(e.target.checked)} disabled />
              Pitch deck (coming soon)
            </label>
            <label className="flex items-center gap-2 opacity-60">
              <input type="checkbox" checked={addonTeamCVs} onChange={(e)=>setAddonTeamCVs(e.target.checked)} disabled />
              Team CVs (coming soon)
            </label>
          </div>
        </div>
      </div>

      {/* Content Preview */}
      {sections.length > 0 && (
        <div className="p-4 border rounded-lg bg-gray-50">
          <h3 className="font-semibold mb-2">Content Preview</h3>
          <div className="text-sm text-gray-600 space-y-1">
            <p>Total sections: {sections.length}</p>
            <p>Completed sections: {sections.filter(s => s.content && s.content.trim().length > 0).length}</p>
            <p>Total words: {sections.reduce((acc, s) => acc + (s.content?.split(' ').length || 0), 0)}</p>
          </div>
        </div>
      )}

      {/* Additional Documents Section */}
      {additionalDocuments.length > 0 && (
        <div className="p-4 border rounded-lg bg-blue-50">
          <h3 className="font-semibold mb-3 flex items-center gap-2">
            📄 Additional Documents
            <span className="text-sm text-gray-600">({additionalDocuments.length} documents)</span>
          </h3>
          <p className="text-sm text-gray-600 mb-3">
            The following additional documents will be included in your export package:
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {additionalDocuments.map((doc, index) => (
              <div key={index} className="flex items-center justify-between p-2 bg-white rounded border text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-green-100 rounded-full flex items-center justify-center">
                    <span className="text-green-600 text-xs">✓</span>
                  </div>
                  <span className="font-medium">{doc.title}</span>
                </div>
                <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                  {doc.format}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

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

      {/* Download functionality */}
      <button 
        className="px-6 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50"
        disabled={exporting || sections.length === 0}
        onClick={async () => {
          setExporting(true);
          try {
            // Track export attempt
            analytics.trackEvent({ 
              event: 'export_attempt', 
              properties: {
                format, 
                sections_count: sections.length,
                is_paid: isPaid 
              }
            });

            // Build PlanDocument-like object from sections
            const plan = {
              id: `export_${Date.now()}`,
              ownerId: 'user',
              product: 'submission' as const,
              route: 'grant' as const,
              language: 'en' as const,
              tone: 'neutral' as const,
              targetLength: 'standard' as const,
              settings: {
                includeTitlePage: true,
                includePageNumbers: true,
                citations: 'simple' as const,
                captions: true,
                graphs: {}
              },
              sections: sections.map(s => ({ key: s.id, title: s.title, content: s.content || '', status: 'missing' as const, tables: (s as any).tables, figures: (s as any).figures })),
              addonPack: false,
              versions: []
            };

            const result = await exportManager.exportPlan(plan as any, {
              format: (format.toUpperCase() as any),
              includeWatermark: !isPaid,
              isPaid,
              quality: 'standard',
              includeToC: true,
              includeListOfFigures: true
            });
            if (!result.success) throw new Error(result.error || 'Export failed');

            // Track successful export
            analytics.trackEvent({ 
              event: 'export_success', 
              properties: {
                format, 
                sections_count: sections.length,
                is_paid: isPaid 
              }
            });

            // After successful export, redirect to thank-you page
            setTimeout(() => {
              window.location.href = '/thank-you';
            }, 2000);
          } catch (error) {
            analytics.trackError(error as Error, 'export_download');
            alert('Export failed. Please try again.');
          } finally {
            setExporting(false);
          }
        }}
      >
        {exporting ? 'Exporting...' : `Download ${format.toUpperCase()} (plan only)`}
      </button>

      <button
        className="px-6 py-2 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-50"
        disabled={exporting || sections.length === 0}
        onClick={async ()=>{
          setExporting(true);
          try {
            // 1) main plan
            if (includePlan) {
              const plan = {
                id: `export_${Date.now()}`,
                ownerId: 'user',
                product: 'submission' as const,
                route: 'grant' as const,
                language: 'en' as const,
                tone: 'neutral' as const,
                targetLength: 'standard' as const,
                settings: { includeTitlePage: true, includePageNumbers: true, citations: 'simple' as const, captions: true, graphs: {} },
                sections: sections.map(s => ({ key: s.id, title: s.title, content: s.content || '', status: 'missing' as const, tables: (s as any).tables, figures: (s as any).figures })),
                addonPack: false,
                versions: []
              };
              await exportManager.exportPlan(plan as any, { format: (format.toUpperCase() as any), includeWatermark: !isPaid, isPaid, quality: 'standard', includeToC: true, includeListOfFigures: true });
            }

            // 2) additional documents (separate PDFs via unified template system)
            const { getDocument } = await import('@/shared/lib/templates');
            const productType = product || 'submission';
            const fundingType = route || 'grants';
            const currentProgramId = router.query.programId as string | undefined;
            
            for (const doc of additionalDocuments) {
              if (!selectedDocs.has(doc.id)) continue;
              
              // Try to get full template from unified system
              const template = await getDocument(fundingType, productType, doc.id, currentProgramId);
              
              if (template && template.template) {
                // Use full template (master or program-specific)
                // Populate template with user data from sections
                let populatedTemplate = template.template;
                
                // Simple placeholder replacement from sections
                sections.forEach(section => {
                  const content = section.content || '';
                  populatedTemplate = populatedTemplate.replace(
                    `[${section.title}]`,
                    content.slice(0, 200) // First 200 chars
                  );
                });
                
                // Convert markdown to HTML for PDF
                const htmlTemplate = populatedTemplate
                  .replace(/# (.*)/g, '<h1 style="font-family:Arial;margin:0 0 16px 0;">$1</h1>')
                  .replace(/## (.*)/g, '<h2 style="font-family:Arial;margin:0 0 12px 0;">$1</h2>')
                  .replace(/\|(.+)\|/g, '<table style="font-family:Arial;border-collapse:collapse;"><tr><td>$1</td></tr></table>')
                  .replace(/\n/g, '<br/>');
                
                await generateSimplePdf(
                  template.name,
                  `<div style='font-family:Arial;padding:20px;'>${htmlTemplate}</div>`,
                  `${sanitizeFilename(template.name)}.pdf`
                );
              } else {
                // Fallback to simple version if no template found
                await generateSimplePdf(`${doc.title}`, `
                  <h1 style='font-family:Arial;margin:0 0 16px 0;'>${doc.title}</h1>
                  <p style='font-family:Arial;color:#374151;'>${doc.description || ''}</p>
                  <hr/>
                  <p style='font-family:Arial;color:#6b7280;'>Generated from your plan selection.</p>
                `, `${sanitizeFilename(doc.title)}.pdf`);
              }
            }

            // 3) add-on one-pager
            if (addonOnePager) {
              const summary = buildOnePager(sections);
              await generateSimplePdf(`One-pager`, summary, `${sanitizeFilename('one-pager')}.pdf`);
            }

            // 4) submission pack
            if (addonSubmissionPack) {
              const html = buildSubmissionPack(sections, additionalDocuments.filter(d=>selectedDocs.has(d.id)));
              await generateSimplePdf(`Submission pack`, html, `${sanitizeFilename('submission-pack')}.pdf`);
            }
          } catch (error) {
            analytics.trackError(error as Error, 'export_multiple');
            alert('Export failed. Please try again.');
          } finally {
            setExporting(false);
          }
        }}
      >
        {exporting ? 'Exporting...' : 'Download selected (separate files)'}
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

