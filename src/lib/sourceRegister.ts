// Source Register - Tracks data freshness for top 20 AT programs
import rawPrograms from '@/data/programs';

export interface SourceEntry {
  programId: string;
  programName: string;
  url: string;
  type: 'HTML' | 'PDF' | 'FAQ' | 'API';
  extractionMethod: 'manual' | 'scraper' | 'api' | 'pdf_parser';
  lastChecked: string;
  hash: string;
  reviewer: string;
  status: 'active' | 'stale' | 'error' | 'deprecated';
  nextCheck: string;
}

export interface SourceRegister {
  version: string;
  lastUpdated: string;
  entries: SourceEntry[];
  stats: {
    total: number;
    active: number;
    stale: number;
    error: number;
    deprecated: number;
  };
}

export class SourceRegisterManager {
  private register: SourceRegister;

  constructor() {
    this.register = this.initializeRegister();
  }

  private initializeRegister(): SourceRegister {
    const programs = rawPrograms.programs;
    const top20Programs = programs.slice(0, 20); // Top 20 programs
    
    const entries: SourceEntry[] = top20Programs.map(program => ({
      programId: program.id,
      programName: program.name,
      url: program.evidence_links?.[0] || 'https://example.com',
      type: this.detectSourceType(program.evidence_links?.[0] || ''),
      extractionMethod: 'manual', // Default to manual
      lastChecked: program.overlays?.[0]?.last_checked || '2025-01-15',
      hash: this.generateHash(program),
      reviewer: 'system',
      status: this.determineStatus(program.overlays?.[0]?.last_checked || '2025-01-15'),
      nextCheck: this.calculateNextCheck(program.overlays?.[0]?.last_checked || '2025-01-15')
    }));

    return {
      version: '1.0.0',
      lastUpdated: new Date().toISOString(),
      entries,
      stats: {
        total: entries.length,
        active: entries.filter(e => e.status === 'active').length,
        stale: entries.filter(e => e.status === 'stale').length,
        error: entries.filter(e => e.status === 'error').length,
        deprecated: entries.filter(e => e.status === 'deprecated').length
      }
    };
  }

  private detectSourceType(url: string): 'HTML' | 'PDF' | 'FAQ' | 'API' {
    if (url.includes('.pdf')) return 'PDF';
    if (url.includes('faq') || url.includes('help')) return 'FAQ';
    if (url.includes('api')) return 'API';
    return 'HTML';
  }

  private generateHash(program: any): string {
    // Simple hash based on program content
    const content = JSON.stringify({
      name: program.name,
      eligibility: program.eligibility,
      overlays: program.overlays
    });
    return this.simpleHash(content);
  }

  private simpleHash(str: string): string {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash).toString(16);
  }

  private determineStatus(lastChecked: string): 'active' | 'stale' | 'error' | 'deprecated' {
    const lastCheckDate = new Date(lastChecked);
    const now = new Date();
    const daysSinceCheck = (now.getTime() - lastCheckDate.getTime()) / (1000 * 60 * 60 * 24);
    
    if (daysSinceCheck > 30) return 'stale';
    if (daysSinceCheck > 90) return 'deprecated';
    return 'active';
  }

  private calculateNextCheck(lastChecked: string): string {
    const lastCheckDate = new Date(lastChecked);
    const nextCheck = new Date(lastCheckDate.getTime() + (7 * 24 * 60 * 60 * 1000)); // 7 days
    return nextCheck.toISOString();
  }

  /**
   * Get the current source register
   */
  getRegister(): SourceRegister {
    return this.register;
  }

  /**
   * Simulate a data change and show diff
   */
  simulateDataChange(programId: string, changes: Partial<SourceEntry>): {
    before: SourceEntry;
    after: SourceEntry;
    diff: string[];
  } {
    const entry = this.register.entries.find(e => e.programId === programId);
    if (!entry) {
      throw new Error(`Program ${programId} not found in register`);
    }

    const before = { ...entry };
    const after = { ...entry, ...changes };
    
    const diff: string[] = [];
    Object.keys(changes).forEach(key => {
      const oldValue = before[key as keyof SourceEntry];
      const newValue = after[key as keyof SourceEntry];
      if (oldValue !== newValue) {
        diff.push(`${key}: "${oldValue}" → "${newValue}"`);
      }
    });

    return { before, after, diff };
  }

  /**
   * Check if tree regeneration is needed
   */
  needsTreeRegeneration(): boolean {
    const staleEntries = this.register.entries.filter(e => e.status === 'stale');
    return staleEntries.length > 0;
  }

  /**
   * Get programs that need updating
   */
  getStalePrograms(): SourceEntry[] {
    return this.register.entries.filter(e => e.status === 'stale');
  }

  /**
   * Generate diff report for PR
   */
  generateDiffReport(): string {
    const stalePrograms = this.getStalePrograms();
    
    let report = '# Data Freshness Diff Report\n\n';
    report += `Generated: ${new Date().toISOString()}\n`;
    report += `Stale Programs: ${stalePrograms.length}\n\n`;
    
    if (stalePrograms.length === 0) {
      report += '✅ All programs are up to date!\n';
      return report;
    }

    report += '## Programs Requiring Updates\n\n';
    
    stalePrograms.forEach(program => {
      report += `### ${program.programName}\n`;
      report += `- **URL**: ${program.url}\n`;
      report += `- **Last Checked**: ${program.lastChecked}\n`;
      report += `- **Status**: ${program.status}\n`;
      report += `- **Next Check**: ${program.nextCheck}\n\n`;
    });

    report += '## Recommended Actions\n\n';
    report += '1. Update stale program data\n';
    report += '2. Regenerate decision tree\n';
    report += '3. Run coverage validation\n';
    report += '4. Update source register hashes\n\n';

    return report;
  }
}

// Export singleton instance
export const sourceRegister = new SourceRegisterManager();
