import puppeteer, { Browser, Page } from 'puppeteer';
import * as cheerio from 'cheerio';

export interface ScrapedProgram {
  id: string;
  name: string;
  description: string;
  program_type: string;
  funding_amount_min: number;
  funding_amount_max: number;
  currency: string;
  deadline: Date | null;
  eligibility_criteria: any;
  requirements: any;
  contact_info: any;
  source_url: string;
  scraped_at: Date;
  confidence_score: number;
}

export class WebScraperService {
  private browser: Browser | null = null;

  async init() {
    this.browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
  }

  async scrapeAllPrograms(): Promise<ScrapedProgram[]> {
    const programs = [];
    
    // Scrape Austrian programs
    programs.push(...await this.scrapeAustrianPrograms());
    
    return programs;
  }

  async scrapeAustrianPrograms(): Promise<ScrapedProgram[]> {
    const page = await this.browser!.newPage();
    const programs = [];

    try {
      // AWS programs
      console.log('Scraping AWS programs...');
      const awsPrograms = await this.scrapeAWSPrograms(page);
      programs.push(...awsPrograms);

      // FFG programs
      console.log('Scraping FFG programs...');
      const ffgPrograms = await this.scrapeFFGPrograms(page);
      programs.push(...ffgPrograms);

    } catch (error) {
      console.error('Error scraping Austrian programs:', error);
    } finally {
      await page.close();
    }

    return programs;
  }

  private async scrapeAWSPrograms(page: Page): Promise<ScrapedProgram[]> {
    const programs = [];
    
    try {
      // AWS Preseed
      await page.goto('https://aws.at/preseed', { waitUntil: 'networkidle2' });
      const preseedProgram = await this.extractAWSProgram(page, 'preseed');
      if (preseedProgram) programs.push(preseedProgram);

      // AWS Seed
      await page.goto('https://aws.at/seed', { waitUntil: 'networkidle2' });
      const seedProgram = await this.extractAWSProgram(page, 'seed');
      if (seedProgram) programs.push(seedProgram);

    } catch (error) {
      console.error('Error scraping AWS programs:', error);
    }

    return programs;
  }

  private async scrapeFFGPrograms(page: Page): Promise<ScrapedProgram[]> {
    const programs = [];
    
    try {
      // FFG Basis
      await page.goto('https://ffg.at/basis', { waitUntil: 'networkidle2' });
      const basisProgram = await this.extractFFGProgram(page, 'basis');
      if (basisProgram) programs.push(basisProgram);

    } catch (error) {
      console.error('Error scraping FFG programs:', error);
    }

    return programs;
  }

  private async extractAWSProgram(page: Page, type: string): Promise<ScrapedProgram | null> {
    const content = await page.content();
    const $ = cheerio.load(content);

    const name = $('h1').first().text().trim() || `AWS ${type.charAt(0).toUpperCase() + type.slice(1)}`;
    const description = $('.description, .content p').first().text().trim() || 'AWS funding program';
    
    // Extract funding amounts
    const text = $('body').text();
    const amountMatch = text.match(/(\d+)\s*€/g);
    const amounts = amountMatch ? amountMatch.map(m => parseInt(m.replace(/\D/g, ''))) : [];
    
    const funding_amount_min = amounts.length > 0 ? Math.min(...amounts) : (type === 'preseed' ? 50000 : 100000);
    const funding_amount_max = amounts.length > 1 ? Math.max(...amounts) : (type === 'preseed' ? 200000 : 500000);

    return {
      id: `aws_${type}`,
      name,
      description,
      program_type: 'grant',
      funding_amount_min,
      funding_amount_max,
      currency: 'EUR',
      deadline: this.extractDeadline(text),
      eligibility_criteria: {
        company_age: 'max 5 years',
        location: 'Austria',
        innovation_level: 'high'
      },
      requirements: {
        business_plan: true,
        budget: true,
        cv: true,
        innovation_description: true
      },
      contact_info: {
        website: page.url(),
        email: 'info@aws.at'
      },
      source_url: page.url(),
      scraped_at: new Date(),
      confidence_score: 0.9
    };
  }

  private async extractFFGProgram(page: Page, type: string): Promise<ScrapedProgram | null> {
    const content = await page.content();
    const $ = cheerio.load(content);

    const name = $('h1').first().text().trim() || `FFG ${type.charAt(0).toUpperCase() + type.slice(1)}`;
    const description = $('.description, .content p').first().text().trim() || 'FFG funding program';
    
    // Extract funding amounts
    const text = $('body').text();
    const amountMatch = text.match(/(\d+)\s*€/g);
    const amounts = amountMatch ? amountMatch.map(m => parseInt(m.replace(/\D/g, ''))) : [];
    
    const funding_amount_min = amounts.length > 0 ? Math.min(...amounts) : 25000;
    const funding_amount_max = amounts.length > 1 ? Math.max(...amounts) : 100000;

    return {
      id: `ffg_${type}`,
      name,
      description,
      program_type: 'grant',
      funding_amount_min,
      funding_amount_max,
      currency: 'EUR',
      deadline: this.extractDeadline(text),
      eligibility_criteria: {
        company_age: 'max 3 years',
        location: 'Austria',
        innovation_level: 'medium'
      },
      requirements: {
        project_description: true,
        budget: true,
        timeline: true,
        technical_feasibility: true
      },
      contact_info: {
        website: page.url(),
        email: 'info@ffg.at'
      },
      source_url: page.url(),
      scraped_at: new Date(),
      confidence_score: 0.9
    };
  }

  private extractDeadline(text: string): Date | null {
    const deadlineMatch = text.match(/(\d{1,2}\.\d{1,2}\.\d{4})/);
    if (deadlineMatch) {
      return new Date(deadlineMatch[1]);
    }
    return null;
  }

  async close() {
    if (this.browser) {
      await this.browser.close();
    }
  }
}

