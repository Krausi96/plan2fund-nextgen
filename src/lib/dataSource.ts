// Enhanced Data Source - Combines static JSON with web scraper data
import rawPrograms from "../../data/programs.json";
import { Program } from "../types";

export interface ProgramDataSource {
  getPrograms(): Promise<Program[]>;
  getProgramById(id: string): Promise<Program | null>;
  searchPrograms(query: string): Promise<Program[]>;
  getProgramsByType(type: string): Promise<Program[]>;
  getProgramsByTargetGroup(targetGroup: string): Promise<Program[]>;
}

export class HybridDataSource implements ProgramDataSource {
  private staticPrograms: Program[] = [];
  private scrapedPrograms: Program[] = [];
  private isInitialized = false;

  constructor() {
    // Transform raw programs to match Program type
    this.staticPrograms = (rawPrograms.programs || []).map((rawProgram: any) => ({
      id: rawProgram.id,
      name: rawProgram.name,
      type: rawProgram.type,
      requirements: rawProgram.eligibility || {},
      notes: rawProgram.description,
      maxAmount: rawProgram.thresholds?.max_grant_eur,
      link: rawProgram.link
    }));
  }

  async initialize() {
    if (this.isInitialized) return;
    
    try {
      // Try to load scraped data if available
      const scrapedData = await this.loadScrapedData();
      if (scrapedData && scrapedData.length > 0) {
        this.scrapedPrograms = scrapedData;
        console.log(`✅ Loaded ${scrapedData.length} scraped programs`);
      } else {
        console.log("⚠️ No scraped data found, using static programs only");
      }
    } catch (error) {
      console.log("⚠️ Could not load scraped data, using static programs only");
    }
    
    this.isInitialized = true;
  }

  private async loadScrapedData(): Promise<Program[] | null> {
    // For now, return null to avoid build issues
    // In production, this will be handled by API endpoints
    return null;
  }


  async getPrograms(): Promise<Program[]> {
    await this.initialize();
    
    // Combine static and scraped programs, removing duplicates
    const allPrograms = [...this.staticPrograms];
    
    // Add scraped programs that don't exist in static
    for (const scraped of this.scrapedPrograms) {
      if (!allPrograms.find(p => p.id === scraped.id)) {
        allPrograms.push(scraped);
      }
    }
    
    return allPrograms;
  }

  async getProgramById(id: string): Promise<Program | null> {
    const programs = await this.getPrograms();
    return programs.find(p => p.id === id) || null;
  }

  async searchPrograms(query: string): Promise<Program[]> {
    const programs = await this.getPrograms();
    const lowerQuery = query.toLowerCase();
    
    return programs.filter(program => 
      program.name.toLowerCase().includes(lowerQuery) ||
      (program.notes && program.notes.toLowerCase().includes(lowerQuery)) ||
      program.type.toLowerCase().includes(lowerQuery)
    );
  }

  async getProgramsByType(type: string): Promise<Program[]> {
    const programs = await this.getPrograms();
    return programs.filter(p => p.type === type);
  }

  async getProgramsByTargetGroup(targetGroup: string): Promise<Program[]> {
    const programs = await this.getPrograms();
    return programs.filter(p => 
      p.type.toLowerCase().includes(targetGroup.toLowerCase())
    );
  }

  // Doctor-like diagnostic methods
  async getProgramsBySymptoms(symptoms: Record<string, any>): Promise<Program[]> {
    const programs = await this.getPrograms();
    
    return programs.filter(program => {
      // Check if program matches the symptoms
      let matchScore = 0;
      
      // Check funding amount match
      if (symptoms.fundingAmount && program.maxAmount) {
        const userAmount = symptoms.fundingAmount;
        if (userAmount <= program.maxAmount) {
          matchScore += 0.3;
        }
      }
      
      // Check target group match
      if (symptoms.targetGroup && program.type) {
        if (program.type.toLowerCase().includes(symptoms.targetGroup.toLowerCase())) {
          matchScore += 0.3;
        }
      }
      
      // Check innovation level match
      if (symptoms.innovationLevel && program.notes) {
        const innovationKeywords = ['innovation', 'high-tech', 'deep-tech', 'breakthrough'];
        if (innovationKeywords.some(keyword => program.notes!.toLowerCase().includes(keyword))) {
          matchScore += 0.2;
        }
      }
      
      // Check location match
      if (symptoms.location && program.notes) {
        if (program.notes.toLowerCase().includes(symptoms.location.toLowerCase())) {
          matchScore += 0.2;
        }
      }
      
      return matchScore >= 0.5; // At least 50% match
    });
  }
}

// Export singleton instance
export const dataSource = new HybridDataSource();
