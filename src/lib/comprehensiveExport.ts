/**
 * Comprehensive Export System
 * Integrates all export formats, add-ons, and submission packs
 */

import { PlanDocument } from './schemas/userProfile';
import { exportManager } from './export';
import { SubmissionPackGenerator } from './submissionPack';
import { AddonsGenerator } from './addons';
import { TeamManager } from './teamManagement';

export interface ComprehensiveExportOptions {
  format: 'pdf' | 'docx' | 'json' | 'submission_pack' | 'pitch_deck' | 'team_cv' | 'one_pager' | 'competitor_analysis';
  includeWatermark: boolean;
  isPaid: boolean;
  quality: 'draft' | 'standard' | 'premium';
  includeToC?: boolean;
  includeListOfFigures?: boolean;
  pageSize?: 'A4' | 'Letter';
  theme?: 'serif' | 'sans' | 'modern' | 'classic';
  spacing?: 'compact' | 'normal' | 'relaxed';
  headingNumbering?: boolean;
  pageBreaks?: boolean;
  showPageNumbers?: boolean;
  fontSize?: 'small' | 'medium' | 'large';
  lineHeight?: 'tight' | 'normal' | 'loose';
  programId?: string;
  programName?: string;
  programType?: 'grant' | 'loan' | 'equity' | 'visa';
  teamId?: string;
  brandStyleId?: string;
  language?: 'en' | 'de';
}

export interface ComprehensiveExportResult {
  success: boolean;
  files: {
    name: string;
    content: string | Buffer;
    type: string;
    size: number;
  }[];
  error?: string;
  metadata?: {
    totalSize: number;
    fileCount: number;
    processingTime: number;
    features: string[];
  };
}

export class ComprehensiveExportManager {
  private exportManager: typeof exportManager;
  private submissionPackGenerator: SubmissionPackGenerator | null = null;
  private addonsGenerator: AddonsGenerator | null = null;
  private teamManager: TeamManager;

  constructor() {
    this.exportManager = exportManager;
    this.teamManager = new TeamManager();
  }

  async exportPlan(
    plan: PlanDocument,
    options: ComprehensiveExportOptions,
    userAnswers?: Record<string, any>,
    program?: any
  ): Promise<ComprehensiveExportResult> {
    const startTime = Date.now();
    const files: { name: string; content: string | Buffer; type: string; size: number }[] = [];

    try {
      // Initialize generators
      if (program) {
        this.submissionPackGenerator = new SubmissionPackGenerator(program, plan);
      }
      if (userAnswers) {
        this.addonsGenerator = new AddonsGenerator(plan);
      }

      // Get brand style if team ID provided
      let brandStyle = null;
      if (options.teamId) {
        brandStyle = await this.teamManager.getBrandStyle(options.teamId);
      }

      // Apply brand styling to plan if available
      if (brandStyle) {
        plan = this.applyBrandStyle(plan, brandStyle);
      }

      // Generate main export based on format
      switch (options.format) {
        case 'pdf':
        case 'docx':
        case 'json':
          const mainExport = await this.exportManager.exportPlan(plan, {
            format: options.format.toUpperCase() as any,
            includeWatermark: options.includeWatermark,
            isPaid: options.isPaid,
            quality: options.quality,
            includeToC: options.includeToC,
            includeListOfFigures: options.includeListOfFigures
          });

          if (mainExport.success && mainExport.downloadUrl) {
            files.push({
              name: `${plan.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.${options.format}`,
              content: '', // URL would be used for download
              type: options.format,
              size: 0
            });
          }
          break;

        case 'submission_pack':
          if (this.submissionPackGenerator && options.programId && options.programName && options.programType) {
            const submissionPack = await this.submissionPackGenerator.generateSubmissionPack({
              programId: options.programId,
              programName: options.programName,
              programType: options.programType,
              includeCoverPage: true,
              includeComplianceChecklist: true,
              includePlan: true,
              includeFinancials: true,
              includeTeam: true,
              includeAppendices: true
            });

            if (submissionPack.success) {
              submissionPack.files.forEach(file => {
                files.push({
                  name: file.name,
                  content: file.content,
                  type: file.type,
                  size: Buffer.byteLength(file.content, 'utf8')
                });
              });
            }
          }
          break;

        case 'pitch_deck':
          if (this.addonsGenerator) {
            const pitchDeck = await this.addonsGenerator.generatePitchDeck({
              format: 'pdf',
              includeImages: true,
              includeCharts: true,
              includeBranding: !!brandStyle,
              language: options.language || 'en'
            });

            if (pitchDeck.success) {
              // Convert slides to content
              const pitchDeckContent = pitchDeck.slides.map(slide => 
                `# ${slide.title}\n\n${slide.content}`
              ).join('\n\n---\n\n');

              files.push({
                name: `${plan.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_pitch_deck.txt`,
                content: pitchDeckContent,
                type: 'txt',
                size: Buffer.byteLength(pitchDeckContent, 'utf8')
              });
            }
          }
          break;

        case 'team_cv':
          if (this.addonsGenerator) {
            const teamCVs = await this.addonsGenerator.generateTeamCVs({
              format: 'pdf',
              includeImages: true,
              includeCharts: false,
              includeBranding: !!brandStyle,
              language: options.language || 'en'
            });

            if (teamCVs.success) {
              teamCVs.members.forEach((member) => {
                const cvContent = this.formatTeamMemberCV(member);
                files.push({
                  name: `${member.name.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_cv.txt`,
                  content: cvContent,
                  type: 'txt',
                  size: Buffer.byteLength(cvContent, 'utf8')
                });
              });
            }
          }
          break;

        case 'one_pager':
          if (this.addonsGenerator) {
            const onePager = await this.addonsGenerator.generateOnePager({
              format: 'pdf',
              includeImages: true,
              includeCharts: true,
              includeBranding: !!brandStyle,
              language: options.language || 'en'
            });

            if (onePager.success) {
              files.push({
                name: `${plan.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_one_pager.txt`,
                content: onePager.content,
                type: 'txt',
                size: Buffer.byteLength(onePager.content, 'utf8')
              });
            }
          }
          break;

        case 'competitor_analysis':
          if (this.addonsGenerator) {
            const competitorAnalysis = await this.addonsGenerator.generateCompetitorAnalysis({
              format: 'pdf',
              includeImages: true,
              includeCharts: true,
              includeBranding: !!brandStyle,
              language: options.language || 'en'
            });

            if (competitorAnalysis.success) {
              const analysisContent = this.formatCompetitorAnalysis(competitorAnalysis.analysis);
              files.push({
                name: `${plan.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_competitor_analysis.txt`,
                content: analysisContent,
                type: 'txt',
                size: Buffer.byteLength(analysisContent, 'utf8')
              });
            }
          }
          break;
      }

      const processingTime = Date.now() - startTime;
      const totalSize = files.reduce((sum, file) => sum + file.size, 0);

      return {
        success: true,
        files,
        metadata: {
          totalSize,
          fileCount: files.length,
          processingTime,
          features: this.getEnabledFeatures(options)
        }
      };

    } catch (error) {
      return {
        success: false,
        files: [],
        error: error instanceof Error ? error.message : 'Export failed'
      };
    }
  }

  private applyBrandStyle(plan: PlanDocument, _brandStyle: any): PlanDocument {
    // Apply brand styling to plan content
    // This would modify the plan's content to include brand colors, fonts, etc.
    return {
      ...plan,
      // Apply styling modifications here
    };
  }

  private formatTeamMemberCV(member: any): string {
    return `
# ${member.name}
## ${member.role}

### Experience
${member.experience.map((exp: string) => `- ${exp}`).join('\n')}

### Education
${member.education.map((edu: string) => `- ${edu}`).join('\n')}

### Achievements
${member.achievements.map((ach: string) => `- ${ach}`).join('\n')}

---
*Generated by Plan2Fund - AI-Powered Business Planning*
    `.trim();
  }

  private formatCompetitorAnalysis(analysis: any): string {
    return `
# Competitor Analysis

## Our Advantages
${analysis.ourAdvantages.map((adv: string) => `- ${adv}`).join('\n')}

## Market Position
${analysis.marketPosition}

## Differentiation
${analysis.differentiation.map((diff: string) => `- ${diff}`).join('\n')}

## Competitors

${analysis.competitors.map((comp: any) => `
### ${comp.name}
- **Market Share:** ${comp.marketShare}
- **Pricing:** ${comp.pricing}
- **Positioning:** ${comp.positioning}

**Strengths:**
${comp.strengths.map((str: string) => `- ${str}`).join('\n')}

**Weaknesses:**
${comp.weaknesses.map((weak: string) => `- ${weak}`).join('\n')}
`).join('\n')}

---
*Generated by Plan2Fund - AI-Powered Business Planning*
    `.trim();
  }

  private getEnabledFeatures(options: ComprehensiveExportOptions): string[] {
    const features: string[] = [];

    if (options.includeToC) features.push('Table of Contents');
    if (options.includeListOfFigures) features.push('List of Figures');
    if (options.headingNumbering) features.push('Heading Numbering');
    if (options.pageBreaks) features.push('Page Breaks');
    if (options.showPageNumbers) features.push('Page Numbers');
    if (options.teamId) features.push('Team Branding');
    if (options.language === 'de') features.push('German Translation');

    switch (options.format) {
      case 'submission_pack':
        features.push('Program Cover Page', 'Compliance Checklist', 'Application Guidance');
        break;
      case 'pitch_deck':
        features.push('Pitch Slides', 'Visual Design', 'Investor Ready');
        break;
      case 'team_cv':
        features.push('Team Profiles', 'Professional CVs', 'Experience Highlights');
        break;
      case 'one_pager':
        features.push('Executive Summary', 'Key Metrics', 'Contact Info');
        break;
      case 'competitor_analysis':
        features.push('Market Analysis', 'Competitive Positioning', 'Differentiation');
        break;
    }

    return features;
  }
}

export const comprehensiveExportManager = new ComprehensiveExportManager();
export default comprehensiveExportManager;
