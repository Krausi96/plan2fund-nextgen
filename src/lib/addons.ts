/**
 * Add-ons Generator
 * Creates pitch decks, team CVs, one-pagers, and competitor analysis
 */

import { PlanDocument } from './schemas/userProfile';

export interface AddonOptions {
  format: 'pdf' | 'pptx' | 'docx' | 'html';
  includeImages: boolean;
  includeCharts: boolean;
  includeBranding: boolean;
  language: 'en' | 'de';
}

export interface PitchDeckSlide {
  title: string;
  content: string;
  type: 'title' | 'problem' | 'solution' | 'market' | 'business_model' | 'team' | 'financials' | 'ask' | 'contact';
  order: number;
}

export interface TeamMember {
  name: string;
  role: string;
  experience: string[];
  education: string[];
  achievements: string[];
  photo?: string;
}

export interface CompetitorAnalysis {
  competitors: {
    name: string;
    strengths: string[];
    weaknesses: string[];
    marketShare: string;
    pricing: string;
    positioning: string;
  }[];
  ourAdvantages: string[];
  marketPosition: string;
  differentiation: string[];
}

export class AddonsGenerator {
  private plan: PlanDocument;

  constructor(plan: PlanDocument) {
    this.plan = plan;
  }

  async generatePitchDeck(_options: AddonOptions): Promise<{ success: boolean; slides: PitchDeckSlide[]; error?: string }> {
    try {
      const slides: PitchDeckSlide[] = [
        {
          title: this.plan.title || 'Business Pitch',
          content: this.generateTitleSlide(),
          type: 'title',
          order: 1
        },
        {
          title: 'The Problem',
          content: this.generateProblemSlide(),
          type: 'problem',
          order: 2
        },
        {
          title: 'Our Solution',
          content: this.generateSolutionSlide(),
          type: 'solution',
          order: 3
        },
        {
          title: 'Market Opportunity',
          content: this.generateMarketSlide(),
          type: 'market',
          order: 4
        },
        {
          title: 'Business Model',
          content: this.generateBusinessModelSlide(),
          type: 'business_model',
          order: 5
        },
        {
          title: 'Our Team',
          content: this.generateTeamSlide(),
          type: 'team',
          order: 6
        },
        {
          title: 'Financial Projections',
          content: this.generateFinancialsSlide(),
          type: 'financials',
          order: 7
        },
        {
          title: 'Funding Ask',
          content: this.generateAskSlide(),
          type: 'ask',
          order: 8
        },
        {
          title: 'Contact',
          content: this.generateContactSlide(),
          type: 'contact',
          order: 9
        }
      ];

      return { success: true, slides };
    } catch (error) {
      return {
        success: false,
        slides: [],
        error: error instanceof Error ? error.message : 'Failed to generate pitch deck'
      };
    }
  }

  async generateTeamCVs(_options: AddonOptions): Promise<{ success: boolean; members: TeamMember[]; error?: string }> {
    try {
      const members: TeamMember[] = this.extractTeamMembers();
      return { success: true, members };
    } catch (error) {
      return {
        success: false,
        members: [],
        error: error instanceof Error ? error.message : 'Failed to generate team CVs'
      };
    }
  }

  async generateOnePager(_options: AddonOptions): Promise<{ success: boolean; content: string; error?: string }> {
    try {
      const content = this.generateOnePagerContent();
      return { success: true, content };
    } catch (error) {
      return {
        success: false,
        content: '',
        error: error instanceof Error ? error.message : 'Failed to generate one-pager'
      };
    }
  }

  async generateCompetitorAnalysis(_options: AddonOptions): Promise<{ success: boolean; analysis: CompetitorAnalysis; error?: string }> {
    try {
      const analysis = this.generateCompetitorAnalysisContent();
      return { success: true, analysis };
    } catch (error) {
      return {
        success: false,
        analysis: { competitors: [], ourAdvantages: [], marketPosition: '', differentiation: [] },
        error: error instanceof Error ? error.message : 'Failed to generate competitor analysis'
      };
    }
  }

  private generateTitleSlide(): string {
    return `
# ${this.plan.title || 'Business Pitch'}

**Tagline:** [Your compelling one-liner]

**Date:** ${new Date().toLocaleDateString()}

**Presented by:** [Your name/company]

---

## What We Do
[Brief description of your business in 1-2 sentences]

## Our Vision
[Your long-term vision and mission]

## Key Metrics
- [Metric 1]: [Value]
- [Metric 2]: [Value]
- [Metric 3]: [Value]
    `.trim();
  }

  private generateProblemSlide(): string {
    const problemSection = this.plan.sections.find(s => 
      s.title.toLowerCase().includes('problem') || 
      s.title.toLowerCase().includes('challenge')
    );

    return `
# The Problem

## Current Pain Points
${problemSection?.content || '[Describe the key problems your target market faces]'}

## Market Size
- **Total Addressable Market (TAM):** [Value]
- **Serviceable Addressable Market (SAM):** [Value]
- **Serviceable Obtainable Market (SOM):** [Value]

## Why Now?
- [Trend 1 that makes this urgent]
- [Trend 2 that creates opportunity]
- [Trend 3 that supports timing]

## Cost of Inaction
[What happens if this problem isn't solved?]
    `.trim();
  }

  private generateSolutionSlide(): string {
    const solutionSection = this.plan.sections.find(s => 
      s.title.toLowerCase().includes('solution') || 
      s.title.toLowerCase().includes('product')
    );

    return `
# Our Solution

## What We Built
${solutionSection?.content || '[Describe your product/service solution]'}

## Key Features
- **Feature 1:** [Description and benefit]
- **Feature 2:** [Description and benefit]
- **Feature 3:** [Description and benefit]

## How It Works
[Simple explanation of your solution in 3-4 steps]

## Unique Value Proposition
[What makes you different and better than alternatives?]

## Proof Points
- [Evidence 1 that validates your solution]
- [Evidence 2 that shows market fit]
- [Evidence 3 that demonstrates traction]
    `.trim();
  }

  private generateMarketSlide(): string {
    return `
# Market Opportunity

## Target Market
- **Primary:** [Your main target customers]
- **Secondary:** [Additional customer segments]
- **Size:** [Market size and growth rate]

## Customer Segments
1. **[Segment 1]:** [Description, size, needs]
2. **[Segment 2]:** [Description, size, needs]
3. **[Segment 3]:** [Description, size, needs]

## Market Trends
- [Trend 1 driving growth]
- [Trend 2 creating opportunities]
- [Trend 3 supporting adoption]

## Go-to-Market Strategy
- **Channel 1:** [How you'll reach customers]
- **Channel 2:** [Additional channels]
- **Pricing:** [Your pricing strategy]

## Competitive Landscape
[Brief overview of main competitors and your positioning]
    `.trim();
  }

  private generateBusinessModelSlide(): string {
    return `
# Business Model

## Revenue Streams
1. **[Stream 1]:** [Description and pricing]
2. **[Stream 2]:** [Description and pricing]
3. **[Stream 3]:** [Description and pricing]

## Key Metrics
- **Customer Acquisition Cost (CAC):** [Value]
- **Lifetime Value (LTV):** [Value]
- **LTV/CAC Ratio:** [Value]
- **Monthly Recurring Revenue (MRR):** [Value]

## Unit Economics
- **Price per unit:** [Value]
- **Cost per unit:** [Value]
- **Gross margin:** [Value]%
- **Break-even point:** [Value] units

## Growth Strategy
- [Strategy 1 for scaling]
- [Strategy 2 for expansion]
- [Strategy 3 for market penetration]

## Partnerships
[Key partnerships that support your business model]
    `.trim();
  }

  private generateTeamSlide(): string {
    const teamMembers = this.extractTeamMembers();
    
    return `
# Our Team

## Leadership Team
${teamMembers.map(member => `
**${member.name}** - ${member.role}
${member.experience.slice(0, 2).join(', ')}
`).join('\n')}

## Advisory Board
[Key advisors and their expertise]

## Why We're the Right Team
- [Reason 1 - relevant experience]
- [Reason 2 - complementary skills]
- [Reason 3 - track record]

## Hiring Plan
- [Key roles to hire next]
- [Timeline for expansion]
- [How you'll attract talent]

## Culture & Values
[Your company culture and core values]
    `.trim();
  }

  private generateFinancialsSlide(): string {
    return `
# Financial Projections

## Revenue Forecast
- **Year 1:** €[Amount]
- **Year 2:** €[Amount]
- **Year 3:** €[Amount]

## Key Financial Metrics
- **Gross Margin:** [Value]%
- **EBITDA Margin:** [Value]%
- **Cash Flow Positive:** [Month/Year]

## Funding Requirements
- **Total Funding Needed:** €[Amount]
- **Use of Funds:**
  - [Category 1]: [Percentage]%
  - [Category 2]: [Percentage]%
  - [Category 3]: [Percentage]%

## Key Assumptions
- [Assumption 1 about growth]
- [Assumption 2 about market]
- [Assumption 3 about costs]

## Exit Strategy
[How investors will realize returns]
    `.trim();
  }

  private generateAskSlide(): string {
    return `
# Funding Ask

## What We're Raising
- **Amount:** €[Amount]
- **Round:** [Series A/Seed/etc.]
- **Use of Funds:** [How you'll use the money]

## Milestones
- [Milestone 1]: [Timeline]
- [Milestone 2]: [Timeline]
- [Milestone 3]: [Timeline]

## Investor Benefits
- [Benefit 1 for investors]
- [Benefit 2 for investors]
- [Benefit 3 for investors]

## Next Steps
1. [Step 1 in the process]
2. [Step 2 in the process]
3. [Step 3 in the process]

## Timeline
- [Timeline for closing the round]
- [Key dates and milestones]
    `.trim();
  }

  private generateContactSlide(): string {
    return `
# Thank You

## Contact Information
- **Email:** [your-email@company.com]
- **Phone:** [your-phone-number]
- **Website:** [your-website.com]
- **LinkedIn:** [your-linkedin-profile]

## Q&A
[Time for questions and discussion]

## Follow-up
- [What you'll send next]
- [When you'll follow up]
- [How to stay in touch]

---

**Thank you for your time and consideration!**
    `.trim();
  }

  private extractTeamMembers(): TeamMember[] {
    // This would extract team information from the plan
    // For now, return a template structure
    return [
      {
        name: '[CEO Name]',
        role: 'CEO & Founder',
        experience: ['[Previous role 1]', '[Previous role 2]'],
        education: ['[Degree] from [University]'],
        achievements: ['[Achievement 1]', '[Achievement 2]']
      },
      {
        name: '[CTO Name]',
        role: 'CTO & Co-founder',
        experience: ['[Previous role 1]', '[Previous role 2]'],
        education: ['[Degree] from [University]'],
        achievements: ['[Achievement 1]', '[Achievement 2]']
      }
    ];
  }

  private generateOnePagerContent(): string {
    return `
# ${this.plan.title || 'Business One-Pager'}

## The Problem
[Brief description of the problem you're solving - 2-3 sentences]

## Our Solution
[Your solution in 2-3 sentences]

## Market Opportunity
- **Market Size:** [Value]
- **Target Customers:** [Description]
- **Growth Rate:** [Percentage]%

## Business Model
- **Revenue Streams:** [List main revenue sources]
- **Pricing:** [Your pricing strategy]
- **Key Metrics:** [CAC, LTV, etc.]

## Traction
- [Key metric 1]: [Value]
- [Key metric 2]: [Value]
- [Key metric 3]: [Value]

## Team
[Brief team overview - 2-3 sentences]

## Financials
- **Revenue (Year 1):** €[Amount]
- **Revenue (Year 2):** €[Amount]
- **Funding Needed:** €[Amount]

## Contact
- **Email:** [your-email@company.com]
- **Website:** [your-website.com]
- **Phone:** [your-phone-number]

---
*Generated by Plan2Fund - AI-Powered Business Planning*
    `.trim();
  }

  private generateCompetitorAnalysisContent(): CompetitorAnalysis {
    return {
      competitors: [
        {
          name: '[Competitor 1]',
          strengths: ['[Strength 1]', '[Strength 2]'],
          weaknesses: ['[Weakness 1]', '[Weakness 2]'],
          marketShare: '[Percentage]%',
          pricing: '[Pricing model]',
          positioning: '[How they position themselves]'
        },
        {
          name: '[Competitor 2]',
          strengths: ['[Strength 1]', '[Strength 2]'],
          weaknesses: ['[Weakness 1]', '[Weakness 2]'],
          marketShare: '[Percentage]%',
          pricing: '[Pricing model]',
          positioning: '[How they position themselves]'
        }
      ],
      ourAdvantages: [
        '[Our advantage 1]',
        '[Our advantage 2]',
        '[Our advantage 3]'
      ],
      marketPosition: '[How we position ourselves in the market]',
      differentiation: [
        '[What makes us different 1]',
        '[What makes us different 2]',
        '[What makes us different 3]'
      ]
    };
  }
}
