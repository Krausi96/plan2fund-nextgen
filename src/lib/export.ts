// Export System with PDF Generation and Watermarks
import { PlanDocument } from './schemas/userProfile';
// import analytics from './analytics';
import featureFlags from './featureFlags';

export interface ExportOptions {
  format: 'PDF' | 'DOCX' | 'JSON' | 'SUBMISSION_PACK';
  includeWatermark: boolean;
  isPaid: boolean;
  quality: 'draft' | 'standard' | 'premium';
  includeToC?: boolean;
  includeListOfFigures?: boolean;
  pageSize?: 'A4' | 'Letter';
  pageBreaks?: boolean;
}

export interface ExportResult {
  success: boolean;
  downloadUrl?: string;
  error?: string;
  fileSize?: number;
}

class ExportManager {
  private async generatePDF(plan: PlanDocument, options: ExportOptions): Promise<ExportResult> {
    try {
      // Track export start
      // await analytics.trackExportStart(plan.id, 'PDF');

      // Create HTML content
      const htmlContent = this.generateHTML(plan, options);
      
      // Generate PDF using html2pdf (client-side)
      if (typeof window !== 'undefined') {
        const html2pdf = (await import('html2pdf.js')).default;
        
        const element = document.createElement('div');
        element.innerHTML = htmlContent;
        document.body.appendChild(element);

        const opt = {
          margin: 1,
          filename: `${plan.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.pdf`,
          image: { type: 'jpeg' as const, quality: 0.98 },
          html2canvas: { scale: 2 },
          jsPDF: { unit: 'in', format: 'letter', orientation: 'portrait' as const }
        };

        await html2pdf().set(opt).from(element).save();
        document.body.removeChild(element);

        // Track export completion
        // await analytics.trackExportComplete(plan.id, 'PDF', options.isPaid);

        return {
          success: true,
          fileSize: 0 // html2pdf doesn't provide file size
        };
      } else {
        throw new Error('PDF generation only available in browser');
      }
    } catch (error) {
      console.error('Error generating PDF:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  private generateHTML(plan: PlanDocument, options: ExportOptions): string {
    const watermark = options.includeWatermark ? this.generateWatermark() : '';
    
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>${plan.title}</title>
          <style>
            body {
              font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
              line-height: 1.6;
              color: #333;
              max-width: 800px;
              margin: 0 auto;
              padding: 40px 20px;
              background: white;
            }
            .header {
              text-align: center;
              margin-bottom: 40px;
              border-bottom: 2px solid #2563eb;
              padding-bottom: 20px;
            }
            .title {
              font-size: 28px;
              font-weight: bold;
              color: #1e40af;
              margin-bottom: 10px;
            }
            .subtitle {
              font-size: 16px;
              color: #6b7280;
            }
            .section {
              margin-bottom: 30px;
              page-break-inside: avoid;
            }
            .section-title {
              font-size: 20px;
              font-weight: bold;
              color: #1e40af;
              margin-bottom: 15px;
              border-left: 4px solid #2563eb;
              padding-left: 15px;
            }
            .section-content {
              font-size: 14px;
              line-height: 1.8;
              text-align: justify;
            }
            .watermark {
              position: fixed;
              top: 50%;
              left: 50%;
              transform: translate(-50%, -50%) rotate(-45deg);
              font-size: 48px;
              color: rgba(0, 0, 0, 0.1);
              z-index: -1;
              pointer-events: none;
              user-select: none;
            }
            .footer {
              margin-top: 40px;
              padding-top: 20px;
              border-top: 1px solid #e5e7eb;
              text-align: center;
              font-size: 12px;
              color: #6b7280;
            }
            .metadata {
              display: flex;
              justify-content: space-between;
              margin-bottom: 20px;
              font-size: 12px;
              color: #6b7280;
            }
            @media print {
              body { margin: 0; padding: 20px; }
              .section { page-break-inside: avoid; }
            }
          </style>
        </head>
        <body>
          ${watermark}
          
          <div class="header">
            <div class="title">${plan.title}</div>
            <div class="subtitle">Business Plan</div>
          </div>

          <div class="metadata">
            <div>Generated: ${new Date().toLocaleDateString()}</div>
            <div>Word Count: ${plan.metadata.wordCount}</div>
            <div>Completion: ${plan.metadata.completionPercentage}%</div>
          </div>

          ${plan.sections.map(section => `
            <div class="section">
              <div class="section-title">${section.title}</div>
              <div class="section-content">${this.formatContent(section.content)}</div>
            </div>
          `).join('')}

          <div class="footer">
            <p>Generated by Plan2Fund - Your Austrian Business Planning Partner</p>
            <p>Visit us at plan2fund.at for more tools and resources</p>
          </div>
        </body>
      </html>
    `;
  }

  private generateWatermark(): string {
    const isPaid = featureFlags.isEnabled('EXPORT_PAYWALL');
    const watermarkText = isPaid ? 'PREMIUM EXPORT' : 'DRAFT - UPGRADE TO EXPORT';
    
    return `<div class="watermark">${watermarkText}</div>`;
  }

  private formatContent(content: string): string {
    // Convert markdown-like formatting to HTML
    return content
      .replace(/\n\n/g, '</p><p>')
      .replace(/\n/g, '<br>')
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/^(.+)$/gm, '<p>$1</p>');
  }

  async exportPlan(plan: PlanDocument, options: ExportOptions): Promise<ExportResult> {
    try {
      // Check if user has paid access
      if (options.format === 'PDF' && options.isPaid && !featureFlags.isEnabled('EXPORT_PAYWALL')) {
        return {
          success: false,
          error: 'Export feature not available'
        };
      }

      switch (options.format) {
        case 'PDF':
          return await this.generatePDF(plan, options);
        case 'DOCX':
          return await this.generateDOCX(plan, options);
        case 'JSON':
          return await this.generateJSON(plan, options);
        case 'SUBMISSION_PACK':
          return await this.generateSubmissionPack(plan, options);
        default:
          throw new Error(`Unsupported format: ${options.format}`);
      }
    } catch (error) {
      console.error('Export error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Export failed'
      };
    }
  }

  private async generateDOCX(plan: PlanDocument, options: ExportOptions): Promise<ExportResult> {
    try {
      // Import DOCX library dynamically
      const { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType, PageBreak } = await import('docx');
      const { saveAs } = await import('file-saver');

      // Create document
      const children: any[] = [];

      // Add title
      if (plan.title) {
        children.push(
          new Paragraph({
            text: plan.title,
            heading: HeadingLevel.TITLE,
            alignment: AlignmentType.CENTER,
            spacing: { after: 400 }
          })
        );
      }

      // Add metadata
      if (plan.metadata) {
        children.push(
          new Paragraph({
            text: `Created: ${new Date(plan.createdAt).toLocaleDateString()}`,
            alignment: AlignmentType.CENTER,
            spacing: { after: 200 }
          })
        );
      }

      // Add sections
      plan.sections.forEach((section, index) => {
        if (section.content) {
          // Add section heading
          children.push(
            new Paragraph({
              text: section.title,
              heading: HeadingLevel.HEADING_1,
              spacing: { before: 400, after: 200 }
            })
          );

          // Add section content
          const content = section.content.split('\n');
          content.forEach(line => {
            if (line.trim()) {
              // Check if it's a heading
              if (line.startsWith('##')) {
                children.push(
                  new Paragraph({
                    text: line.replace(/^#+\s*/, ''),
                    heading: HeadingLevel.HEADING_2,
                    spacing: { before: 300, after: 150 }
                  })
                );
              } else if (line.startsWith('###')) {
                children.push(
                  new Paragraph({
                    text: line.replace(/^#+\s*/, ''),
                    heading: HeadingLevel.HEADING_3,
                    spacing: { before: 200, after: 100 }
                  })
                );
              } else if (line.startsWith('**') && line.endsWith('**')) {
                // Bold text
                children.push(
                  new Paragraph({
                    children: [new TextRun({
                      text: line.replace(/\*\*/g, ''),
                      bold: true
                    })],
                    spacing: { after: 100 }
                  })
                );
              } else {
                // Regular paragraph
                children.push(
                  new Paragraph({
                    text: line,
                    spacing: { after: 100 }
                  })
                );
              }
            }
          });

          // Add page break between sections (except last)
          if (options.pageBreaks && index < plan.sections.length - 1) {
            children.push(new Paragraph({ children: [new PageBreak()] }));
          }
        }
      });

      // Create document with content
      const doc = new Document({
        sections: [{
          properties: {
            page: {
              size: {
                width: options.pageSize === 'A4' ? 595 : 612, // A4 vs Letter width in points
                height: options.pageSize === 'A4' ? 842 : 792  // A4 vs Letter height in points
              }
            }
          },
          children: children
        }]
      });

      // Generate and save
      const buffer = await Packer.toBuffer(doc);
      const blob = new Blob([new Uint8Array(buffer)], { 
        type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' 
      });
      
      const filename = `${plan.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.docx`;
      saveAs(blob, filename);

      return {
        success: true,
        fileSize: buffer.length
      };
    } catch (error) {
      console.error('Error generating DOCX:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'DOCX generation failed'
      };
    }
  }

  private async generateJSON(plan: PlanDocument, options: ExportOptions): Promise<ExportResult> {
    try {
      const exportData = {
        title: plan.title,
        sections: plan.sections,
        metadata: plan.metadata,
        exportOptions: options,
        generatedAt: new Date().toISOString(),
        version: '1.0'
      };

      const jsonString = JSON.stringify(exportData, null, 2);
      const blob = new Blob([jsonString], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      
      const a = document.createElement('a');
      a.href = url;
      a.download = `${plan.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.json`;
      a.click();
      URL.revokeObjectURL(url);

      return {
        success: true,
        fileSize: blob.size
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'JSON export failed'
      };
    }
  }

  private async generateSubmissionPack(plan: PlanDocument, options: ExportOptions): Promise<ExportResult> {
    try {
      const htmlContent = this.generateSubmissionPackHTML(plan, options);
      
      if (typeof window !== 'undefined') {
        const html2pdf = (await import('html2pdf.js')).default;
        
        const element = document.createElement('div');
        element.innerHTML = htmlContent;
        document.body.appendChild(element);

        const opt = {
          margin: 1,
          filename: `${plan.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_submission_pack.pdf`,
          image: { type: 'jpeg' as const, quality: 0.98 },
          html2canvas: { scale: 2 },
          jsPDF: { unit: 'in', format: 'letter', orientation: 'portrait' as const }
        };

        await html2pdf().set(opt).from(element).save();
        document.body.removeChild(element);

        return {
          success: true,
          fileSize: 0
        };
      } else {
        throw new Error('Submission pack generation only available in browser');
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Submission pack generation failed'
      };
    }
  }

  private generateSubmissionPackHTML(plan: PlanDocument, options: ExportOptions): string {
    const toc = this.generateTableOfContents(plan);
    const listOfFigures = this.generateListOfFigures(plan);
    
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>${plan.title} - Submission Pack</title>
          <style>
            body {
              font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
              line-height: 1.6;
              color: #333;
              max-width: 800px;
              margin: 0 auto;
              padding: 40px 20px;
              background: white;
            }
            .cover-page {
              text-align: center;
              margin-bottom: 60px;
              page-break-after: always;
            }
            .cover-title {
              font-size: 32px;
              font-weight: bold;
              color: #1e40af;
              margin-bottom: 20px;
            }
            .cover-subtitle {
              font-size: 18px;
              color: #6b7280;
              margin-bottom: 40px;
            }
            .cover-info {
              font-size: 14px;
              color: #6b7280;
              margin-bottom: 20px;
            }
            .checklist {
              background: #f8fafc;
              border: 1px solid #e2e8f0;
              border-radius: 8px;
              padding: 20px;
              margin: 20px 0;
            }
            .checklist h3 {
              color: #1e40af;
              margin-bottom: 15px;
            }
            .checklist-item {
              display: flex;
              align-items: center;
              margin-bottom: 8px;
            }
            .checklist-item input[type="checkbox"] {
              margin-right: 10px;
            }
            .toc {
              margin: 20px 0;
            }
            .toc h3 {
              color: #1e40af;
              margin-bottom: 15px;
            }
            .toc-item {
              display: flex;
              justify-content: space-between;
              padding: 5px 0;
              border-bottom: 1px dotted #e2e8f0;
            }
            .toc-title {
              flex: 1;
            }
            .toc-page {
              color: #6b7280;
            }
            .section {
              margin-bottom: 30px;
              page-break-inside: avoid;
            }
            .section-title {
              font-size: 20px;
              font-weight: bold;
              color: #1e40af;
              margin-bottom: 15px;
              border-left: 4px solid #2563eb;
              padding-left: 15px;
            }
            .section-content {
              font-size: 14px;
              line-height: 1.8;
              text-align: justify;
            }
            .footer {
              margin-top: 40px;
              padding-top: 20px;
              border-top: 1px solid #e5e7eb;
              text-align: center;
              font-size: 12px;
              color: #6b7280;
            }
            @media print {
              body { margin: 0; padding: 20px; }
              .section { page-break-inside: avoid; }
            }
          </style>
        </head>
        <body>
          <!-- Cover Page -->
          <div class="cover-page">
            <div class="cover-title">${plan.title}</div>
            <div class="cover-subtitle">Business Plan Submission Pack</div>
            <div class="cover-info">
              <p>Generated: ${new Date().toLocaleDateString()}</p>
              <p>Word Count: ${plan.metadata.wordCount}</p>
              <p>Completion: ${plan.metadata.completionPercentage}%</p>
            </div>
          </div>

          <!-- Submission Checklist -->
          <div class="checklist">
            <h3>Pre-Submission Checklist</h3>
            <div class="checklist-item">
              <input type="checkbox" id="check1">
              <label for="check1">All required sections completed</label>
            </div>
            <div class="checklist-item">
              <input type="checkbox" id="check2">
              <label for="check2">Financial projections included</label>
            </div>
            <div class="checklist-item">
              <input type="checkbox" id="check3">
              <label for="check3">Supporting documents attached</label>
            </div>
            <div class="checklist-item">
              <input type="checkbox" id="check4">
              <label for="check4">Proofread for errors</label>
            </div>
            <div class="checklist-item">
              <input type="checkbox" id="check5">
              <label for="check5">Formatting consistent</label>
            </div>
            <div class="checklist-item">
              <input type="checkbox" id="check6">
              <label for="check6">Contact information updated</label>
            </div>
          </div>

          ${options.includeToC ? `
            <!-- Table of Contents -->
            <div class="toc">
              <h3>Table of Contents</h3>
              ${toc}
            </div>
          ` : ''}

          ${options.includeListOfFigures ? `
            <!-- List of Figures -->
            <div class="toc">
              <h3>List of Figures</h3>
              ${listOfFigures}
            </div>
          ` : ''}

          <!-- Business Plan Content -->
          ${plan.sections.map(section => `
            <div class="section">
              <div class="section-title">${section.title}</div>
              <div class="section-content">${this.formatContent(section.content)}</div>
            </div>
          `).join('')}

          <div class="footer">
            <p>Generated by Plan2Fund - Your Austrian Business Planning Partner</p>
            <p>Visit us at plan2fund.at for more tools and resources</p>
          </div>
        </body>
      </html>
    `;
  }

  private generateTableOfContents(plan: PlanDocument): string {
    return plan.sections.map((section, index) => `
      <div class="toc-item">
        <span class="toc-title">${section.title}</span>
        <span class="toc-page">${index + 3}</span>
      </div>
    `).join('');
  }

  private generateListOfFigures(plan: PlanDocument): string {
    // Extract figures from content (simplified implementation)
    const figures: string[] = [];
    plan.sections.forEach(section => {
      const figureMatches = section.content.match(/!\[([^\]]*)\]\([^)]*\)/g);
      if (figureMatches) {
        figureMatches.forEach(fig => {
          const title = fig.match(/!\[([^\]]*)\]/)?.[1] || 'Untitled Figure';
          figures.push(title);
        });
      }
    });

    if (figures.length === 0) {
      return '<p>No figures found in this document.</p>';
    }

    return figures.map((figure, index) => `
      <div class="toc-item">
        <span class="toc-title">Figure ${index + 1}: ${figure}</span>
        <span class="toc-page">-</span>
      </div>
    `).join('');
  }

  // Get export pricing based on user segment
  getExportPricing(userSegment: string): { draft: number; standard: number; premium: number } {
    const pricing = {
      B2C_FOUNDER: { draft: 0, standard: 29, premium: 49 },
      SME_LOAN: { draft: 0, standard: 99, premium: 149 },
      VISA: { draft: 0, standard: 79, premium: 129 },
      PARTNER: { draft: 0, standard: 0, premium: 0 } // Free for partners
    };

    return pricing[userSegment as keyof typeof pricing] || pricing.B2C_FOUNDER;
  }

  // Check if user can export for free
  canExportFree(userSegment: string, planCompletion: number): boolean {
    // Free export for partners or if plan is less than 50% complete
    return userSegment === 'PARTNER' || planCompletion < 50;
  }
}

export const exportManager = new ExportManager();
export default exportManager;
