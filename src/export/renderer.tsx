// ========= PLAN2FUND — EXPORT RENDERER =========
// PDF/DOCX export renderer with professional formatting

import { PlanDocument } from '../types/plan';
import { getExportLabels } from '../i18n/settings';

export interface ExportOptions {
  format: 'PDF' | 'DOCX';
  includeWatermark: boolean;
  quality: 'draft' | 'standard' | 'premium';
}

export interface ExportResult {
  success: boolean;
  downloadUrl?: string;
  error?: string;
}

export class ExportRenderer {
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

  private async renderPDF(plan: PlanDocument, options: ExportOptions, labels: any): Promise<ExportResult> {
    // This would integrate with html2pdf or similar
    const htmlContent = this.generateHTML(plan, options, labels);
    
    if (typeof window !== 'undefined') {
      const html2pdf = (await import('html2pdf.js')).default;
      
      const element = document.createElement('div');
      element.innerHTML = htmlContent;
      document.body.appendChild(element);

      const opt = {
        margin: 1,
        filename: `${plan.id.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.pdf`,
        image: { type: 'jpeg' as const, quality: 0.98 },
        html2canvas: { scale: 2 },
        jsPDF: { unit: 'in', format: 'letter', orientation: 'portrait' as const }
      };

      await html2pdf().set(opt).from(element).save();
      document.body.removeChild(element);

      return {
        success: true,
        downloadUrl: `${plan.id}.pdf`
      };
    } else {
      throw new Error('PDF generation only available in browser');
    }
  }

  private async renderDOCX(plan: PlanDocument, _options: ExportOptions, _labels: any): Promise<ExportResult> {
    // This would integrate with docx library
    // For now, return a placeholder
    return {
      success: true,
      downloadUrl: `${plan.id}.docx`
    };
  }

  private generateHTML(plan: PlanDocument, _options: ExportOptions, labels: any): string {
    let html = `
      <!DOCTYPE html>
      <html lang="${plan.language}">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${plan.id}</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; margin: 0; padding: 20px; }
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
        </style>
      </head>
      <body>
    `;

    // Title Page
    if (plan.settings.includeTitlePage) {
      html += `
        <div class="title-page">
          <h1>${plan.id}</h1>
          <p>${plan.product === 'strategy' ? 'Strategy Document' : 
              plan.product === 'review' ? 'Update & Review' : 
              'Submission-Ready Business Plan'}</p>
          <p>Route: ${plan.route.toUpperCase()}</p>
          <p>Date: ${new Date().toLocaleDateString()}</p>
        </div>
      `;
    }

    // Content Sections
    plan.sections.forEach((section, index) => {
      const pageNumber = plan.settings.includePageNumbers ? 
        `<div class="page-number">${labels.pageNumber} ${index + (plan.settings.includeTitlePage ? 2 : 1)}</div>` : '';
      
      html += `
        <div class="section">
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
