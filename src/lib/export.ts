// Export System with PDF Generation and Watermarks
import { PlanDocument } from './schemas/userProfile';
// import analytics from './analytics';
import featureFlags from './featureFlags';

export interface ExportOptions {
  format: 'PDF' | 'DOCX';
  includeWatermark: boolean;
  isPaid: boolean;
  quality: 'draft' | 'standard' | 'premium';
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

  private async generateDOCX(_plan: PlanDocument, _options: ExportOptions): Promise<ExportResult> {
    // DOCX generation would require a server-side implementation
    // For now, return an error
    return {
      success: false,
      error: 'DOCX export not yet implemented'
    };
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
