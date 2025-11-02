// ========= PLAN2FUND — EXPORT RENDERER =========
// PDF/DOCX export renderer with professional formatting

import { PlanDocument } from '../types/plan';
import { getExportLabels } from '../i18n/settings';

export interface ExportOptions {
  format: 'PDF' | 'DOCX';
  includeWatermark: boolean;
  watermarkText?: string;
  quality: 'draft' | 'standard' | 'premium';
  theme?: 'serif' | 'sans' | 'modern' | 'classic';
  fontSize?: 'small' | 'medium' | 'large';
  spacing?: 'compact' | 'normal' | 'relaxed';
  showPageNumbers?: boolean;
  showTableOfContents?: boolean;
}

export interface PreviewOptions {
  showWatermark?: boolean;
  watermarkText?: string;
  previewMode?: 'preview' | 'formatted' | 'print';
  selectedSections?: Set<string>;
  previewSettings?: {
    showWordCount?: boolean;
    showCharacterCount?: boolean;
    showCompletionStatus?: boolean;
    enableRealTimePreview?: boolean;
  };
}

export interface ExportResult {
  success: boolean;
  downloadUrl?: string;
  error?: string;
}

class ExportRenderer {
  async renderPlan(plan: PlanDocument, options: ExportOptions): Promise<ExportResult> {
    try {
      const labels = getExportLabels(plan.language);
      
      switch (options.format) {
        case 'PDF':
          return await this.renderPDF(plan, options, labels);
        case 'DOCX':
          return await this.renderDOCX(plan, options, labels);
        default:
          throw new Error(`Unsupported format: ${options.format}`);
      }
    } catch (error) {
      console.error('Export render error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Export failed'
      };
    }
  }

  renderPreview(plan: PlanDocument, options: PreviewOptions = {}): JSX.Element {
    const {
      showWatermark = false,
      watermarkText = 'DRAFT',
      previewMode = 'preview',
      selectedSections,
      previewSettings = {}
    } = options;

    const sectionsToRender = selectedSections && selectedSections.size > 0
      ? plan.sections.filter(section => selectedSections.has(section.key))
      : plan.sections;

    return (
      <div className={`export-preview ${previewMode}`}>
        {showWatermark && (
          <div className="fixed inset-0 pointer-events-none flex items-center justify-center z-0">
            <div className="text-6xl font-bold text-gray-200 opacity-30 transform -rotate-45 select-none">
              {watermarkText}
            </div>
          </div>
        )}
        
        <div className="relative z-10 space-y-8">
          {/* Title Page */}
          {plan.settings.includeTitlePage && (
            <div className="text-center py-12 border-b">
              <h1 className="text-4xl font-bold text-gray-900 mb-2">{plan.settings.titlePage?.title || 'Business Plan'}</h1>
              {plan.settings.titlePage?.subtitle && (
                <p className="text-lg text-gray-700 mb-1">{plan.settings.titlePage.subtitle}</p>
              )}
              {plan.settings.titlePage?.author && (
                <p className="text-base text-gray-600 mb-1">{plan.settings.titlePage.author}</p>
              )}
              <p className="text-sm text-gray-500">{plan.settings.titlePage?.date || new Date().toLocaleDateString()}</p>
            </div>
          )}

          {/* Table of Contents */}
          <div className="space-y-2">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Table of Contents</h2>
            <div className="space-y-1">
              {sectionsToRender.map((section, index) => (
                <div key={section.key} className="flex justify-between items-center py-1">
                  <span className="text-blue-600 hover:text-blue-800 cursor-pointer">
                    {index + 1}. {section.title}
                  </span>
                  {previewSettings.showWordCount && section.content && (
                    <span className="text-xs text-gray-500">
                      {section.content.split(' ').length} words
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Content Sections */}
          {sectionsToRender.map((section) => {
            const hasContent = section.content && section.content.trim().length > 0;
            const wordCount = section.content ? section.content.split(' ').length : 0;
            const charCount = section.content ? section.content.length : 0;
            
            return (
              <div key={section.key} className="space-y-4">
                <div className="border-b border-gray-200 pb-2">
                  <h2 className="text-2xl font-semibold text-gray-900">{section.title}</h2>
                  {previewSettings.showCompletionStatus && (
                    <div className="flex items-center gap-4 mt-2 text-sm text-gray-600">
                      {hasContent ? (
                        <span className="flex items-center gap-1 text-green-600">
                          <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                          Complete
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-red-600">
                          <span className="w-2 h-2 bg-red-500 rounded-full"></span>
                          Incomplete
                        </span>
                      )}
                      {previewSettings.showWordCount && (
                        <span>{wordCount} words</span>
                      )}
                      {previewSettings.showCharacterCount && (
                        <span>{charCount} characters</span>
                      )}
                    </div>
                  )}
                </div>
                
                <div className={`prose max-w-none ${
                  previewMode === 'formatted' ? 'font-serif' : 'font-sans'
                }`}>
                  {hasContent ? (
                    <div className="whitespace-pre-wrap text-gray-800 leading-relaxed">
                      {section.content}
                    </div>
                  ) : (
                    <div className="text-gray-400 italic py-8 text-center border-2 border-dashed border-gray-200 rounded-lg">
                      No content available for this section
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  private async renderPDF(plan: PlanDocument, options: ExportOptions, labels: any): Promise<ExportResult> {
    try {
      if (typeof window === 'undefined') {
        throw new Error('PDF generation only available in browser');
      }

      const html2pdf = (await import('html2pdf.js')).default;
      
      // Generate HTML content with better styling
      const htmlContent = this.generateHTML(plan, options, labels);
      
      // Create a temporary container with proper styling
      const element = document.createElement('div');
      element.innerHTML = htmlContent;
      element.style.cssText = `
        font-family: ${options.theme === 'serif' ? 'Times, serif' : 'Arial, sans-serif'};
        font-size: ${options.fontSize === 'small' ? '12px' : options.fontSize === 'large' ? '16px' : '14px'};
        line-height: ${options.spacing === 'compact' ? '1.4' : options.spacing === 'relaxed' ? '1.8' : '1.6'};
        color: #333;
        max-width: 800px;
        margin: 0 auto;
        padding: 20px;
        background: white;
      `;
      
      // Add to DOM temporarily
      document.body.appendChild(element);

      // Configure PDF options based on quality
      const pdfOptions = {
        margin: options.quality === 'premium' ? 0.5 : options.quality === 'draft' ? 1.5 : 1,
        filename: `${plan.id.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.pdf`,
        image: { 
          type: 'jpeg' as const, 
          quality: options.quality === 'premium' ? 1.0 : options.quality === 'draft' ? 0.7 : 0.9 
        },
        html2canvas: { 
          scale: options.quality === 'premium' ? 3 : options.quality === 'draft' ? 1.5 : 2,
          useCORS: true,
          letterRendering: true
        },
        jsPDF: { 
          unit: 'in', 
          format: 'a4', 
          orientation: 'portrait' as const,
          compress: true
        },
        pagebreak: { mode: ['avoid-all', 'css', 'legacy'] }
      };

      // Generate PDF
      await html2pdf().set(pdfOptions).from(element).save();
      
      // Clean up
      document.body.removeChild(element);

      return {
        success: true,
        downloadUrl: `${plan.id}.pdf`
      };
    } catch (error) {
      console.error('Error generating PDF:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'PDF generation failed'
      };
    }
  }

  private async renderDOCX(plan: PlanDocument, options: ExportOptions, _labels: any): Promise<ExportResult> {
    try {
      if (typeof window === 'undefined') {
        throw new Error('DOCX generation only available in browser');
      }

      // Import DOCX library dynamically
      const { Document, Packer, Paragraph, HeadingLevel, AlignmentType, PageBreak, Table, TableRow, TableCell, WidthType } = await import('docx');
      const { saveAs } = await import('file-saver');

      // Create document children
      const children: any[] = [];

      // Add title page
      if (plan.settings.includeTitlePage) {
        children.push(
          new Paragraph({
            text: plan.settings.titlePage?.title || 'Business Plan',
            heading: HeadingLevel.TITLE,
            alignment: AlignmentType.CENTER,
            spacing: { after: 400 }
          })
        );

        if (plan.settings.titlePage?.subtitle) {
          children.push(new Paragraph({ text: plan.settings.titlePage.subtitle, alignment: AlignmentType.CENTER, spacing: { after: 200 } }));
        }
        if (plan.settings.titlePage?.author) {
          children.push(new Paragraph({ text: plan.settings.titlePage.author, alignment: AlignmentType.CENTER, spacing: { after: 200 } }));
        }

        children.push(
          new Paragraph({
            text: `${plan.settings.titlePage?.date || new Date().toLocaleDateString()}`,
            alignment: AlignmentType.CENTER,
            spacing: { after: 400 }
          }),
          new PageBreak()
        );
      }

      // Add table of contents if requested
      if (options.showTableOfContents) {
        children.push(
          new Paragraph({
            text: 'Table of Contents',
            heading: HeadingLevel.HEADING_1,
            spacing: { after: 200 }
          })
        );

        plan.sections.forEach((section, index) => {
          children.push(
            new Paragraph({
              text: `${index + 1}. ${section.title}`,
              spacing: { after: 100 }
            })
          );
        });

        children.push(new PageBreak());
      }

      // Add sections
      plan.sections.forEach((section, index) => {
        if (section.content && section.content.trim()) {
          // Section title
          children.push(
            new Paragraph({
              text: section.title,
              heading: HeadingLevel.HEADING_1,
              spacing: { before: 400, after: 200 }
            })
          );

          // Section content
          const content = section.content.replace(/<[^>]*>/g, ''); // Strip HTML tags
          const paragraphs = content.split('\n').filter(p => p.trim());
          
          paragraphs.forEach(paragraph => {
            if (paragraph.trim()) {
              children.push(
                new Paragraph({
                  text: paragraph.trim(),
                  spacing: { after: 100 }
                })
              );
            }
          });

          // Add tables if they exist
          if (section.tables) {
            Object.entries(section.tables).forEach(([tableName, table]) => {
              if (table && table.rows && table.rows.length > 0) {
                children.push(
                  new Paragraph({
                    text: `${tableName.charAt(0).toUpperCase() + tableName.slice(1)} Table`,
                    heading: HeadingLevel.HEADING_2,
                    spacing: { before: 300, after: 200 }
                  })
                );

                // Create table
                const tableRows = [
                  new TableRow({
                    children: table.columns.map(col => 
                      new TableCell({
                        children: [new Paragraph({ text: col, heading: HeadingLevel.HEADING_3 })],
                        width: { size: 100 / table.columns.length, type: WidthType.PERCENTAGE }
                      })
                    )
                  })
                ];

                table.rows.forEach(row => {
                  tableRows.push(
                    new TableRow({
                      children: [
                        new TableCell({
                          children: [new Paragraph({ text: row.label })],
                          width: { size: 30, type: WidthType.PERCENTAGE }
                        }),
                        ...row.values.map(value => 
                          new TableCell({
                            children: [new Paragraph({ text: value.toString() })],
                            width: { size: 70 / (row.values.length), type: WidthType.PERCENTAGE }
                          })
                        )
                      ]
                    })
                  );
                });

                children.push(
                  new Table({
                    rows: tableRows,
                    width: { size: 100, type: WidthType.PERCENTAGE }
                  })
                );
              }
            });
          }

          // Add page break between sections (except last)
          if (index < plan.sections.length - 1) {
            children.push(new PageBreak());
          }
        }
      });

      // Add watermark if requested
      if (options.includeWatermark) {
        children.push(
          new Paragraph({
            text: options.watermarkText || 'DRAFT',
            alignment: AlignmentType.CENTER,
            spacing: { before: 200 }
          })
        );
      }

      // Create document
      const doc = new Document({
        sections: [{
          properties: {},
          children: children
        }]
      });

      // Generate and save DOCX
      const buffer = await Packer.toBuffer(doc);
      const uint8Array = new Uint8Array(buffer);
      const blob = new Blob([uint8Array], { type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' });
      
      const filename = `${plan.id.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.docx`;
      saveAs(blob, filename);

      return {
        success: true,
        downloadUrl: filename
      };
    } catch (error) {
      console.error('Error generating DOCX:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'DOCX generation failed'
      };
    }
  }

  private generateHTML(plan: PlanDocument, options: ExportOptions, labels: any): string {
    const theme = options.theme || 'sans';
    const fontSize = options.fontSize || 'medium';
    const spacing = options.spacing || 'normal';
    
    const fontFamily = {
      'serif': 'Times New Roman, serif',
      'sans': 'Arial, sans-serif',
      'modern': 'Helvetica, sans-serif',
      'classic': 'Georgia, serif'
    }[theme];
    
    const fontSizeValue = {
      'small': '12px',
      'medium': '14px',
      'large': '16px'
    }[fontSize];
    
    const lineHeight = {
      'compact': '1.4',
      'normal': '1.6',
      'relaxed': '1.8'
    }[spacing];
    
    let html = `
      <!DOCTYPE html>
      <html lang="${plan.language}">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${plan.id}</title>
        <style>
          body { 
            font-family: ${fontFamily}; 
            font-size: ${fontSizeValue};
            line-height: ${lineHeight}; 
            margin: 0; 
            padding: 20px;
            position: relative;
          }
          .watermark {
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%) rotate(-45deg);
            font-size: 72px;
            font-weight: bold;
            color: rgba(0, 0, 0, 0.1);
            z-index: -1;
            pointer-events: none;
            user-select: none;
          }
          .title-page { text-align: center; page-break-after: always; padding: 50px 0; }
          .section { margin-bottom: 30px; }
          .section h1 { color: #2563eb; font-size: 24px; margin-bottom: 15px; }
          .section h2 { color: #1e40af; font-size: 20px; margin-bottom: 12px; }
          .section h3 { color: #1e3a8a; font-size: 16px; margin-bottom: 8px; }
          .table { width: 100%; border-collapse: collapse; margin: 15px 0; }
          .table th, .table td { border: 1px solid #ddd; padding: 8px; text-align: left; }
          .table th { background-color: #f3f4f6; }
          .figure { text-align: center; margin: 20px 0; }
          .figure-caption { font-style: italic; margin-top: 10px; }
          .sources { margin-top: 30px; }
          .page-number { position: fixed; bottom: 20px; right: 20px; font-size: 12px; }
          .toc { margin-bottom: 30px; }
          .toc ul { list-style: none; padding-left: 0; }
          .toc li { margin: 5px 0; }
          .toc a { text-decoration: none; color: #2563eb; }
        </style>
      </head>
      <body>
    `;
    
    // Add watermark if enabled
    if (options.includeWatermark && options.watermarkText) {
      html += `<div class="watermark">${options.watermarkText}</div>`;
    }

    // Title Page
    if (plan.settings.includeTitlePage) {
      html += `
        <div class="title-page">
          <h1>${plan.settings.titlePage?.title || 'Business Plan'}</h1>
          ${plan.settings.titlePage?.subtitle ? `<p>${plan.settings.titlePage.subtitle}</p>` : ''}
          ${plan.settings.titlePage?.author ? `<p>${plan.settings.titlePage.author}</p>` : ''}
          <p>${plan.settings.titlePage?.date || new Date().toLocaleDateString()}</p>
        </div>
      `;
    }

    // Table of Contents
    if (options.showTableOfContents) {
      html += `
        <div class="toc">
          <h2>Table of Contents</h2>
          <ul>
            ${plan.sections.map((section, index) => `
              <li><a href="#section-${index}">${section.title}</a></li>
            `).join('')}
          </ul>
        </div>
      `;
    }

    // Content Sections
    plan.sections.forEach((section, index) => {
      const pageNumber = options.showPageNumbers ? 
        `<div class="page-number">${labels.pageNumber} ${index + (plan.settings.includeTitlePage ? 2 : 1)}</div>` : '';
      
      html += `
        <div class="section" id="section-${index}">
          <h1>${section.title}</h1>
          <div>${this.formatContent(section.content)}</div>
          ${pageNumber}
        </div>
      `;

      // Tables
      if (section.tables) {
        Object.entries(section.tables).forEach(([tableType, table]) => {
          if (table) {
            html += this.renderTable(table, tableType, labels);
          }
        });
      }

      // Figures
      if (section.figures) {
        section.figures.forEach((figure, figIndex) => {
          html += this.renderFigure(figure, figIndex + 1, labels);
        });
      }
    });

    // Sources
    const allSources = plan.sections
      .filter(s => s.sources && s.sources.length > 0)
      .flatMap(s => s.sources || []);
    
    if (allSources.length > 0 && plan.settings.citations === 'simple') {
      html += `
        <div class="sources">
          <h2>${labels.sources}</h2>
          <ul>
            ${allSources.map(source => `
              <li>${source.title} — ${source.url} — ${labels.accessedDate} ${new Date().toLocaleDateString()}</li>
            `).join('')}
          </ul>
        </div>
      `;
    }

    // Route Extras
    if (plan.attachments && plan.attachments.length > 0) {
      html += `
        <div class="section">
          <h2>Included Route Extras</h2>
          <ul>
            ${plan.attachments.map(attachment => `
              <li>${this.getAttachmentLabel(attachment.type)}</li>
            `).join('')}
          </ul>
        </div>
      `;
    }

    html += `</body></html>`;
    return html;
  }

  private formatContent(content: string): string {
    return content
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/^(.+)$/gm, '<p>$1</p>');
  }

  private renderTable(table: any, tableType: string, labels: any): string {
    return `
      <div class="figure">
        <table class="table">
          <thead>
            <tr>
              <th>Item</th>
              ${table.columns.map((col: string) => `<th>${col}</th>`).join('')}
            </tr>
          </thead>
          <tbody>
            ${table.rows.map((row: any) => `
              <tr>
                <td>${row.label}</td>
                ${row.values.map((value: number) => `<td>${value}</td>`).join('')}
              </tr>
            `).join('')}
          </tbody>
        </table>
        <div class="figure-caption">${labels.table} ${tableType}</div>
      </div>
    `;
  }

  private renderFigure(figure: any, figureNumber: number, labels: any): string {
    return `
      <div class="figure">
        <div style="background: #f3f4f6; border: 2px dashed #d1d5db; padding: 40px; text-align: center;">
          <div style="font-size: 24px; margin-bottom: 10px;">
            ${figure.type === 'line' ? '📈' : figure.type === 'bar' ? '📊' : '🍩'}
          </div>
          <div>${figure.type.toUpperCase()} Chart - ${figure.dataRef}</div>
        </div>
        <div class="figure-caption">${labels.figure} ${figureNumber}: ${figure.caption || figure.dataRef}</div>
      </div>
    `;
  }

  private getAttachmentLabel(type: string): string {
    const labels: Record<string, string> = {
      integratedBudget: 'Budget/Planning Sheet',
      workPackagesTimeline: 'Work Packages & Timeline',
      bankSummaryPage: 'Bank Summary (Ratios & Repayment)',
      investorTeaserOnePager: 'Investor Teaser One-Pager',
      capTableBasic: 'Basic Cap Table'
    };
    return labels[type] || type;
  }

}

export const exportRenderer = new ExportRenderer();

// Default export component for direct JSX usage
function ExportRendererComponent({ 
  plan, 
  showWatermark = false, 
  watermarkText = 'DRAFT', 
  previewMode = 'preview',
  selectedSections,
  previewSettings = {}
}: {
  plan: PlanDocument;
  showWatermark?: boolean;
  watermarkText?: string;
  previewMode?: 'preview' | 'formatted' | 'print';
  selectedSections?: Set<string>;
  previewSettings?: {
    showWordCount?: boolean;
    showCharacterCount?: boolean;
    showCompletionStatus?: boolean;
    enableRealTimePreview?: boolean;
  };
}) {
  return exportRenderer.renderPreview(plan, {
    showWatermark,
    watermarkText,
    previewMode,
    selectedSections,
    previewSettings
  });
}

export default ExportRendererComponent;
