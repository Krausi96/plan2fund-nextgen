// Export System with PDF Generation and Watermarks
import { PlanDocument } from '@/features/editor/types/plan';
// import analytics from './analytics';
import { isFeatureEnabled } from '@/shared/user/featureFlags';

export interface ExportOptions {
  format: 'PDF' | 'DOCX';
  includeWatermark: boolean;
  isPaid: boolean;
  quality: 'draft' | 'standard' | 'premium';
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
  private testMode = false;

  constructor() {
    // Check if we're in test mode (no external services)
    this.testMode = !process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || process.env.NODE_ENV === 'test';
    if (this.testMode) {
      console.log('­ƒº¬ Export Test Mode: Using mock export functionality');
    }
  }

  private async generatePDF(plan: PlanDocument, options: ExportOptions, subscriptionTier: 'free' | 'premium' | 'enterprise' = 'free'): Promise<ExportResult> {
    try {
      // Track export start
      // await analytics.trackExportStart(plan.id, 'PDF');

      // Test mode: return mock PDF
      if (this.testMode) {
        console.log('­ƒº¬ Export Test Mode: Generating mock PDF');
        return {
          success: true,
          downloadUrl: 'data:text/plain;base64,' + btoa('Mock PDF content for: ' + (plan.settings.titlePage?.title || 'Business Plan')),
          fileSize: 1024
        };
      }

      // Create HTML content
      const htmlContent = this.generateHTML(plan, options, subscriptionTier);
      
      // Generate PDF using html2pdf (client-side)
      if (typeof window !== 'undefined') {
        const html2pdf = (await import('html2pdf.js')).default;
        
        const element = document.createElement('div');
        element.innerHTML = htmlContent;
        document.body.appendChild(element);

        const title = plan.settings.titlePage?.title || 'Business Plan';
        const opt = {
          margin: 1,
          filename: `${title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.pdf`,
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

  private generateHTML(plan: PlanDocument, options: ExportOptions, subscriptionTier: 'free' | 'premium' | 'enterprise' = 'free'): string {
    const watermark = options.includeWatermark ? this.generateWatermark(subscriptionTier) : '';
    
    // Get formatting from plan settings if available (fallback to defaults)
    const fontFamily = (plan.settings as any)?.fontFamily || 'Segoe UI, Tahoma, Geneva, Verdana, sans-serif';
    const fontSize = (plan.settings as any)?.fontSize || 14;
    const lineHeight = (plan.settings as any)?.lineHeight || (plan.settings as any)?.lineSpacing || 1.6;
    const margins = (plan.settings as any)?.margins || { top: 2.5, bottom: 2.5, left: 2.5, right: 2.5 };
    
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>${plan.settings.titlePage?.title || 'Business Plan'}</title>
          <style>
            body {
              font-family: ${fontFamily};
              font-size: ${fontSize}pt;
              line-height: ${lineHeight};
              color: #333;
              max-width: 800px;
              margin: 0 auto;
              padding: ${margins.top}cm ${margins.right}cm ${margins.bottom}cm ${margins.left}cm;
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
            .table-container {
              margin: 20px 0;
              overflow-x: auto;
            }
            table {
              width: 100%;
              border-collapse: collapse;
              border: 1px solid #e5e7eb;
              margin: 10px 0;
            }
            th, td {
              padding: 8px 12px;
              text-align: left;
              border: 1px solid #e5e7eb;
            }
            th {
              background-color: #f3f4f6;
              font-weight: bold;
            }
            .figure-container {
              margin: 20px 0;
              text-align: center;
            }
            .figure-container img {
              max-width: 100%;
              height: auto;
              border: 1px solid #e5e7eb;
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
            <div class="title">${plan.settings.titlePage?.title || 'Business Plan'}</div>
            <div class="subtitle">Business Plan</div>
          </div>

          <div class="metadata">
            <div>Generated: ${new Date().toLocaleDateString()}</div>
            <div>Word Count: ${plan.sections.reduce((sum, s) => sum + (s.content || '').split(/\s+/).filter(w => w.length > 0).length, 0)}</div>
            <div>Completion: ${Math.round((plan.sections.filter(s => s.status === 'aligned').length / plan.sections.length) * 100)}%</div>
          </div>

          ${plan.sections.map(section => {
            // Render tables if they exist
            let tablesHTML = '';
            if (section.tables && Object.keys(section.tables).length > 0) {
              tablesHTML = Object.entries(section.tables).map(([tableKey, table]) => {
                if (!table) return '';
                
                // Handle different table formats
                let headers: string[] = [];
                let rows: any[] = [];
                
                // Check if it's the new format (headers/rows from datasets)
                if ('headers' in table && Array.isArray((table as any).headers)) {
                  headers = (table as any).headers;
                  rows = (table as any).rows || [];
                } 
                // Check if it's the legacy format (columns/rows)
                else if ('columns' in table && Array.isArray((table as any).columns)) {
                  headers = (table as any).columns;
                  rows = (table as any).rows || [];
                }
                
                if (headers.length === 0) return '';
                
                const headersHTML = headers.map((h: string) => `<th>${h}</th>`).join('');
                const rowsHTML = rows.map((row: any) => {
                  let cells = '';
                  if (Array.isArray(row)) {
                    cells = row.map((cell: any) => `<td>${cell || ''}</td>`).join('');
                  } else if (typeof row === 'object') {
                    // Handle object rows (from datasets)
                    cells = headers.map((h: string) => `<td>${row[h] || ''}</td>`).join('');
                  } else {
                    cells = `<td>${row || ''}</td>`;
                  }
                  return `<tr>${cells}</tr>`;
                }).join('');
                
                return `
                  <div class="table-container" style="margin: 20px 0;">
                    <h4 style="font-size: 14px; font-weight: bold; margin-bottom: 10px; color: #1e40af;">${this.formatTableLabel(tableKey)}</h4>
                    <table style="width: 100%; border-collapse: collapse; border: 1px solid #e5e7eb;">
                      <thead>
                        <tr style="background-color: #f3f4f6;">${headersHTML}</tr>
                      </thead>
                      <tbody>${rowsHTML}</tbody>
                    </table>
                  </div>
                `;
              }).join('');
            }
            
            // Render figures/media if they exist
            let figuresHTML = '';
            if (section.figures && section.figures.length > 0) {
              figuresHTML = section.figures.map((figure: any) => {
                const title = figure.title || 'Figure';
                const caption = figure.caption || '';
                const altText = figure.altText || title;
                const uri = figure.uri || '';
                
                if (figure.type === 'image' && uri) {
                  return `
                    <div class="figure-container" style="margin: 20px 0; text-align: center;">
                      <img src="${uri}" alt="${altText}" style="max-width: 100%; height: auto; border: 1px solid #e5e7eb;" />
                      ${caption ? `<p style="font-size: 12px; color: #6b7280; margin-top: 8px; font-style: italic;">${caption}</p>` : ''}
                    </div>
                  `;
                } else {
                  return `
                    <div class="figure-container" style="margin: 20px 0; padding: 20px; border: 1px solid #e5e7eb; background-color: #f9fafb;">
                      <p style="font-weight: bold; margin-bottom: 8px;">${title}</p>
                      ${caption ? `<p style="font-size: 12px; color: #6b7280; font-style: italic;">${caption}</p>` : ''}
                      ${uri ? `<p style="font-size: 11px; color: #9ca3af; margin-top: 8px;">Source: ${uri}</p>` : ''}
                    </div>
                  `;
                }
              }).join('');
            }
            
            return `
              <div class="section">
                <div class="section-title">${section.title}</div>
                <div class="section-content">${this.formatContent(section.content)}</div>
                ${tablesHTML}
                ${figuresHTML}
              </div>
            `;
          }).join('')}

          <div class="footer">
            <p>Generated by Plan2Fund - Your Austrian Business Planning Partner</p>
            <p>Visit us at plan2fund.at for more tools and resources</p>
          </div>
        </body>
      </html>
    `;
  }

  private generateWatermark(subscriptionTier: 'free' | 'premium' | 'enterprise' = 'free'): string {
    const isPaid = isFeatureEnabled('pdf_export', subscriptionTier);
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

  private formatTableLabel(key: string): string {
    // Convert snake_case or kebab-case to Title Case
    return key
      .replace(/[_-]/g, ' ')
      .replace(/\b\w/g, (char) => char.toUpperCase());
  }

  /**
   * Extract structured data from plan for template filling
   */
  extractPlanData(plan: PlanDocument, userAnswers?: Record<string, any>): {
    businessInfo: Record<string, string>;
    financials: Record<string, any>;
    projectData: Record<string, string>;
    metadata: Record<string, string>;
  } {
    // Extract business info from sections and user answers
    const businessInfo: Record<string, string> = {
      BUSINESS_NAME: plan.settings.titlePage?.title || '[Business Name]',
      PROJECT_TITLE: plan.settings.titlePage?.title || '[Project Title]',
      SUBTITLE: plan.settings.titlePage?.subtitle || '',
      AUTHOR: plan.settings.titlePage?.author || '',
      DATE: plan.settings.titlePage?.date || new Date().toLocaleDateString(),
    };

    // Extract from user answers if available
    if (userAnswers) {
      businessInfo.BUSINESS_NAME = userAnswers.business_name || userAnswers.company_name || businessInfo.BUSINESS_NAME;
      businessInfo.BUSINESS_DESCRIPTION = userAnswers.business_description || userAnswers.description || '';
      businessInfo.TARGET_MARKET = userAnswers.target_market || userAnswers.market || '';
      businessInfo.TEAM_SIZE = userAnswers.team_size || userAnswers.team || '';
      businessInfo.FUNDING_AMOUNT = userAnswers.funding_amount || userAnswers.amount || '';
      businessInfo.USE_OF_FUNDS = userAnswers.use_of_funds || userAnswers.useOfFunds || '';
      businessInfo.TIMELINE = userAnswers.timeline || userAnswers.duration || '';
      businessInfo.LOCATION = userAnswers.location || userAnswers.country || '';
      businessInfo.COMPANY_AGE = userAnswers.company_age || userAnswers.age || '';
    }

    // Extract from section content
    plan.sections.forEach(section => {
      const content = section.content || '';
      const title = (section.title || '').toLowerCase();
      
      // Extract business description
      if (title.includes('executive') || title.includes('summary')) {
        businessInfo.EXECUTIVE_SUMMARY = content.slice(0, 500);
      }
      if (title.includes('business') && title.includes('description')) {
        businessInfo.BUSINESS_DESCRIPTION = content.slice(0, 300);
      }
      if (title.includes('market') || title.includes('target')) {
        businessInfo.TARGET_MARKET = content.slice(0, 300);
      }
      if (title.includes('team') || title.includes('management')) {
        businessInfo.TEAM_INFO = content.slice(0, 300);
      }
      if (title.includes('innovation') || title.includes('technology')) {
        businessInfo.INNOVATION = content.slice(0, 300);
      }
      if (title.includes('impact') || title.includes('sustainability')) {
        businessInfo.IMPACT = content.slice(0, 300);
      }
    });

    // Extract financials from tables
    const financials: Record<string, any> = {};
    plan.sections.forEach(section => {
      if (section.tables) {
        if (section.tables.revenue) {
          financials.REVENUE_TABLE = this.formatTable(section.tables.revenue);
          financials.REVENUE_YEAR_1 = section.tables.revenue.rows[0]?.values[0] || 0;
          financials.REVENUE_YEAR_2 = section.tables.revenue.rows[0]?.values[1] || 0;
          financials.REVENUE_YEAR_3 = section.tables.revenue.rows[0]?.values[2] || 0;
          financials.REVENUE_TOTAL = section.tables.revenue.rows
            .find((r: any) => r.label.toLowerCase().includes('total'))?.values?.[0] || 0;
        }
        if (section.tables.costs) {
          financials.COSTS_TABLE = this.formatTable(section.tables.costs);
          financials.COSTS_TOTAL = section.tables.costs.rows
            .find((r: any) => r.label.toLowerCase().includes('total'))?.values?.[0] || 0;
        }
        if (section.tables.cashflow) {
          financials.CASHFLOW_TABLE = this.formatTable(section.tables.cashflow);
        }
        if (section.tables.useOfFunds) {
          financials.USE_OF_FUNDS_TABLE = this.formatTable(section.tables.useOfFunds);
        }
      }
    });

    // Extract project data
    const projectData: Record<string, string> = {
      PROJECT_TITLE: plan.settings.titlePage?.title || '[Project Title]',
      WORD_COUNT: String(plan.sections.reduce((sum, s) => 
        sum + (s.content || '').split(/\s+/).filter((w: string) => w.length > 0).length, 0
      )),
      COMPLETION: String(Math.round((plan.sections.filter(s => s.status === 'aligned').length / plan.sections.length) * 100)) + '%',
    };

    // Extract metadata
    const metadata: Record<string, string> = {
      GENERATED_DATE: new Date().toLocaleDateString(),
      GENERATED_TIME: new Date().toLocaleTimeString(),
      LANGUAGE: plan.language || 'en',
      TONE: plan.tone || 'neutral',
      PRODUCT_TYPE: plan.product || 'submission',
      ROUTE: plan.route || 'grants',
    };

    return { businessInfo, financials, projectData, metadata };
  }

  /**
   * Format table data as markdown table
   */
  private formatTable(table: { columns: string[]; rows: Array<{ label?: string; values: (number | string)[] }> }): string {
    if (!table.columns || !table.rows) return '';
    
    const headers = table.columns.join(' | ');
    const separator = table.columns.map(() => '---').join(' | ');
    const rows = table.rows.map((row, index) => {
      const label = row.label ?? `Row ${index + 1}`;
      const values = row.values.map(v => String(v || 0));
      return `${label} | ${values.join(' | ')}`;
    }).join('\n');
    
    return `| ${headers} |\n| ${separator} |\n${rows}`;
  }

  /**
   * Fill template with extracted data
   * Maps template placeholders (e.g., [Project Name], [Amount]) to extracted data
   */
  fillTemplate(template: string, plan: PlanDocument, userAnswers?: Record<string, any>, program?: any): string {
    const { businessInfo, financials, projectData, metadata } = this.extractPlanData(plan, userAnswers);
    
    let filled = template;

    // Map template placeholders to extracted data keys
    // Templates use: [Project Name], [Amount], [Company Name], [Description], [Date], etc.
    // Extracted data uses: PROJECT_TITLE, FUNDING_AMOUNT, BUSINESS_NAME, etc.
    const placeholderMap: Record<string, string> = {
      // Project/Title mappings
      'Project Name': businessInfo.PROJECT_TITLE || businessInfo.BUSINESS_NAME || '[Project Name]',
      'Project Title': businessInfo.PROJECT_TITLE || businessInfo.BUSINESS_NAME || '[Project Title]',
      'Company Name': businessInfo.BUSINESS_NAME || businessInfo.PROJECT_TITLE || '[Company Name]',
      
      // Financial mappings
      'Amount': businessInfo.FUNDING_AMOUNT || financials.REVENUE_TOTAL || '[Amount]',
      'Total Budget': businessInfo.FUNDING_AMOUNT || financials.REVENUE_TOTAL || '[Total Budget]',
      'Total Project Costs': businessInfo.FUNDING_AMOUNT || financials.COSTS_TOTAL || '[Total Project Costs]',
      'Funding Amount': businessInfo.FUNDING_AMOUNT || '[Funding Amount]',
      
      // Date mappings
      'Start Date': businessInfo.TIMELINE || metadata.GENERATED_DATE || '[Start Date]',
      'End Date': businessInfo.TIMELINE || '[End Date]',
      'Date': metadata.GENERATED_DATE || businessInfo.DATE || '[Date]',
      
      // Description mappings
      'Description': businessInfo.BUSINESS_DESCRIPTION || businessInfo.EXECUTIVE_SUMMARY?.slice(0, 200) || '[Description]',
      'Title': businessInfo.PROJECT_TITLE || businessInfo.BUSINESS_NAME || '[Title]',
      
      // Team/Personnel mappings
      'Lead': businessInfo.TEAM_INFO?.slice(0, 100) || businessInfo.TEAM_SIZE || '[Lead]',
      'Partners': businessInfo.TEAM_SIZE || '[Partners]',
      'Team': businessInfo.TEAM_SIZE || businessInfo.TEAM_INFO?.slice(0, 100) || '[Team]',
      
      // Financial detail mappings
      'Percentage': financials.REVENUE_TOTAL ? '100' : '[Percentage]',
      'Justification': businessInfo.USE_OF_FUNDS?.slice(0, 200) || '[Justification]',
      'Months': businessInfo.TIMELINE || '[Months]',
      
      // Additional common mappings
      'Deliverable': businessInfo.INNOVATION?.slice(0, 150) || '[Deliverable]',
      'Rate/hour': '[Rate/hour]', // Needs specific extraction
      'Hours/week': '[Hours/week]', // Needs specific extraction
      'Number': businessInfo.TEAM_SIZE || '[Number]',
      'Destinations': businessInfo.LOCATION || '[Destinations]',
      'Specific services': businessInfo.USE_OF_FUNDS?.slice(0, 100) || '[Specific services]',
      'List of major equipment': businessInfo.USE_OF_FUNDS?.slice(0, 150) || '[List of major equipment]',
    };

    // Replace template-style placeholders (with spaces)
    Object.entries(placeholderMap).forEach(([placeholder, value]) => {
      const regex = new RegExp(`\\[${placeholder.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\]`, 'g');
      filled = filled.replace(regex, value);
    });

    // Replace extracted data placeholders (with underscores, uppercase) - for backward compatibility
    Object.entries(businessInfo).forEach(([key, value]) => {
      const regex = new RegExp(`\\[${key}\\]`, 'g');
      filled = filled.replace(regex, value || '[Not specified]');
    });

    // Replace financial placeholders
    Object.entries(financials).forEach(([key, value]) => {
      const regex = new RegExp(`\\[${key}\\]`, 'g');
      if (typeof value === 'string') {
        filled = filled.replace(regex, value);
      } else {
        filled = filled.replace(regex, String(value || 0));
      }
    });

    // Replace project data placeholders
    Object.entries(projectData).forEach(([key, value]) => {
      const regex = new RegExp(`\\[${key}\\]`, 'g');
      filled = filled.replace(regex, value || '[Not specified]');
    });

    // Replace metadata placeholders
    Object.entries(metadata).forEach(([key, value]) => {
      const regex = new RegExp(`\\[${key}\\]`, 'g');
      filled = filled.replace(regex, value || '[Not specified]');
    });

    // Replace program info if available
    if (program) {
      filled = filled.replace(/\[PROGRAM_NAME\]/g, program.name || '[Program Name]');
      filled = filled.replace(/\[PROGRAM_TYPE\]/g, program.type || '[Program Type]');
      filled = filled.replace(/\[PROGRAM_AMOUNT\]/g, program.amount || '[Program Amount]');
    }

    // Replace section content placeholders (legacy support)
    plan.sections.forEach(section => {
      const content = section.content || '';
      const plainText = content.replace(/<[^>]*>/g, '').slice(0, 500); // Strip HTML and limit
      filled = filled.replace(
        new RegExp(`\\[${section.title.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\]`, 'g'),
        plainText || '[Section content not available]'
      );
    });

    // Extract and replace financial table values from tables if available
    plan.sections.forEach(section => {
      if (section.tables) {
        // Revenue table
        if (section.tables.revenue) {
          const revenueTable = this.formatTable(section.tables.revenue);
          filled = filled.replace(/\[REVENUE_TABLE\]/g, revenueTable);
          // Replace year-specific placeholders
          section.tables.revenue.rows.forEach((row: any) => {
            if (row.label.toLowerCase().includes('total')) {
              row.values.forEach((val: number, colIdx: number) => {
                filled = filled.replace(new RegExp(`\\[Year ${colIdx + 1}.*?Revenue\\]`, 'gi'), String(val || 0));
              });
            }
          });
        }
        
        // Costs table
        if (section.tables.costs) {
          const costsTable = this.formatTable(section.tables.costs);
          filled = filled.replace(/\[COSTS_TABLE\]/g, costsTable);
        }
        
        // Use of funds table
        if (section.tables.useOfFunds) {
          const useOfFundsTable = this.formatTable(section.tables.useOfFunds);
          filled = filled.replace(/\[USE_OF_FUNDS_TABLE\]/g, useOfFundsTable);
        }
      }
    });

    return filled;
  }

  async exportPlan(plan: PlanDocument, options: ExportOptions, subscriptionTier: 'free' | 'premium' | 'enterprise' = 'free'): Promise<ExportResult> {
    try {
      // Check if user has paid access
      if (options.format === 'PDF' && options.isPaid && !isFeatureEnabled('pdf_export', subscriptionTier)) {
        return {
          success: false,
          error: 'Export feature not available'
        };
      }

      switch (options.format) {
        case 'PDF':
          return await this.generatePDF(plan, options, subscriptionTier);
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

  private async generateDOCX(plan: PlanDocument, options: ExportOptions): Promise<ExportResult> {
    try {
      // Import DOCX library dynamically
      const { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType, PageBreak } = await import('docx');
      const { saveAs } = await import('file-saver');

      // Create document
      const children: any[] = [];

      // Add title
      const title = plan.settings.titlePage?.title || 'Business Plan';
      if (title) {
        children.push(
          new Paragraph({
            text: title,
            heading: HeadingLevel.TITLE,
            alignment: AlignmentType.CENTER,
            spacing: { after: 400 }
          })
        );
      }

      // Add metadata
      const wordCount = plan.sections.reduce((sum, s) => sum + (s.content || '').split(/\s+/).filter(w => w.length > 0).length, 0);
      if (wordCount > 0) {
        children.push(
          new Paragraph({
            text: `Generated: ${new Date().toLocaleDateString()} | Word Count: ${wordCount}`,
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
      
      const filename = `${(plan.settings.titlePage?.title || 'Business Plan').replace(/[^a-z0-9]/gi, '_').toLowerCase()}.docx`;
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
}

export const exportManager = new ExportManager();
export default exportManager;
