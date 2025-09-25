import { NextApiRequest, NextApiResponse } from 'next';

interface AIRequest {
  prompt: string;
  maxWords: number;
  tone: 'neutral' | 'formal' | 'concise';
  language: 'de' | 'en';
  sectionScope: string;
}

interface AIResponse {
  content: string;
  suggestions: string[];
  citations: string[];
}

export default async function handler(req: NextApiRequest, res: NextApiResponse<AIResponse>) {
  if (req.method !== 'POST') {
    return res.status(405).json({ content: '', suggestions: [], citations: [] });
  }

  try {
    const { prompt, maxWords, tone, language, sectionScope }: AIRequest = req.body;

    if (!prompt) {
      return res.status(400).json({ content: '', suggestions: [], citations: [] });
    }

    // For now, we'll use a sophisticated template-based approach
    // In production, this would integrate with OpenAI, Anthropic, or similar
    const response = await generateAIResponse(prompt, maxWords, tone, language, sectionScope);

    res.status(200).json(response);
  } catch (error) {
    console.error('AI generation error:', error);
    res.status(500).json({ 
      content: 'Error generating content. Please try again.', 
      suggestions: [], 
      citations: [] 
    });
  }
}

async function generateAIResponse(
  prompt: string, 
  maxWords: number, 
  tone: 'neutral' | 'formal' | 'concise',
  language: 'de' | 'en',
  sectionScope: string
): Promise<AIResponse> {
  
  // Enhanced template-based generation with program awareness
  const programType = extractProgramType(prompt);
  const businessContext = extractBusinessContext(prompt);
  
  const content = generateSectionContent(sectionScope, programType, businessContext, tone, language, maxWords);
  const suggestions = generateSuggestions(sectionScope, programType);
  const citations = generateCitations(programType, language);

  return {
    content: content.substring(0, maxWords * 6), // Rough word limit
    suggestions,
    citations
  };
}

function extractProgramType(prompt: string): string {
  if (prompt.toLowerCase().includes('grant')) return 'grant';
  if (prompt.toLowerCase().includes('loan')) return 'loan';
  if (prompt.toLowerCase().includes('investor')) return 'equity';
  if (prompt.toLowerCase().includes('visa')) return 'visa';
  return 'business_plan';
}

function extractBusinessContext(prompt: string): any {
  return {
    hasFundingAmount: /\b(€|$)\d+/.test(prompt),
    hasTeamSize: /\b\d+\s*(people|team|employees)/.test(prompt),
    hasMarket: /market|customer|target/.test(prompt),
    hasRevenue: /revenue|income|sales/.test(prompt)
  };
}

function generateSectionContent(
  section: string, 
  programType: string, 
  context: any, 
  tone: string, 
  language: string, 
  _maxWords: number
): string {
  
  const templates = {
    en: {
      executive_summary: generateExecutiveSummary(programType, context, tone),
      business_description: generateBusinessDescription(programType, context, tone),
      market_analysis: generateMarketAnalysis(programType, context, tone),
      financial_projections: generateFinancialProjections(programType, context, tone),
      team: generateTeamSection(programType, context, tone),
      implementation_plan: generateImplementationPlan(programType, context, tone),
      risks: generateRisksSection(programType, context, tone)
    },
    de: {
      executive_summary: generateExecutiveSummaryDE(programType, context, tone),
      business_description: generateBusinessDescriptionDE(programType, context, tone),
      market_analysis: generateMarketAnalysisDE(programType, context, tone),
      financial_projections: generateFinancialProjectionsDE(programType, context, tone),
      team: generateTeamSectionDE(programType, context, tone),
      implementation_plan: generateImplementationPlanDE(programType, context, tone),
      risks: generateRisksSectionDE(programType, context, tone)
    }
  };

  const content = templates[language as keyof typeof templates]?.[section as keyof typeof templates.en] || 
                  templates.en[section as keyof typeof templates.en] || 
                  generateGenericContent(section, programType, context, tone, language);

  return content;
}

// English templates
function generateExecutiveSummary(programType: string, _context: any, _tone: string): string {
  const base = `Our innovative business solution addresses critical market needs through a scalable model that delivers measurable value to customers. We are seeking funding to accelerate growth and expand market reach.`;
  
  if (programType === 'grant') {
    return `${base} This project aligns with the program's innovation objectives and will contribute to technological advancement in our sector.`;
  } else if (programType === 'loan') {
    return `${base} Our strong financial performance and clear repayment strategy make us an ideal candidate for this financing opportunity.`;
  }
  
  return base;
}

function generateBusinessDescription(programType: string, _context: any, _tone: string): string {
  return `Our company operates in the ${programType} sector, providing innovative solutions that solve real-world problems. We have developed a unique value proposition that differentiates us from competitors through our focus on quality, customer service, and technological innovation.`;
}

function generateMarketAnalysis(_programType: string, _context: any, _tone: string): string {
  return `The target market represents a significant opportunity with strong growth potential. Our analysis shows clear demand for our solution with favorable market conditions, competitive advantages, and a clear path to market penetration.`;
}

function generateFinancialProjections(_programType: string, _context: any, _tone: string): string {
  return `Our financial model demonstrates strong unit economics with a clear path to profitability. Revenue projections show sustainable growth over the next 3-5 years, supported by realistic assumptions and market validation.`;
}

function generateTeamSection(_programType: string, _context: any, _tone: string): string {
  return `Our experienced team brings together diverse expertise in technology, business development, and market strategy. We have the skills, passion, and track record necessary to execute our vision and deliver results.`;
}

function generateImplementationPlan(_programType: string, _context: any, _tone: string): string {
  return `Our implementation plan outlines clear milestones, timelines, and deliverables. We have identified key risks and mitigation strategies to ensure successful project execution.`;
}

function generateRisksSection(_programType: string, _context: any, _tone: string): string {
  return `We have identified key risks including market competition, regulatory changes, and execution challenges. Our mitigation strategies include diversification, compliance monitoring, and contingency planning.`;
}

// German templates
function generateExecutiveSummaryDE(programType: string, _context: any, _tone: string): string {
  const base = `Unsere innovative Geschäftslösung adressiert kritische Marktbedürfnisse durch ein skalierbares Modell, das messbaren Wert für Kunden liefert. Wir suchen Finanzierung, um das Wachstum zu beschleunigen und die Marktreichweite zu erweitern.`;
  
  if (programType === 'grant') {
    return `${base} Dieses Projekt entspricht den Innovationszielen des Programms und wird zur technologischen Weiterentwicklung in unserem Sektor beitragen.`;
  } else if (programType === 'loan') {
    return `${base} Unsere starke Finanzperformance und klare Rückzahlungsstrategie machen uns zu einem idealen Kandidaten für diese Finanzierungsmöglichkeit.`;
  }
  
  return base;
}

function generateBusinessDescriptionDE(programType: string, _context: any, _tone: string): string {
  return `Unser Unternehmen operiert im ${programType}-Sektor und bietet innovative Lösungen, die reale Probleme lösen. Wir haben ein einzigartiges Wertversprechen entwickelt, das uns durch unseren Fokus auf Qualität, Kundenservice und technologische Innovation von Wettbewerbern unterscheidet.`;
}

function generateMarketAnalysisDE(_programType: string, _context: any, _tone: string): string {
  return `Der Zielmarkt stellt eine bedeutende Chance mit starkem Wachstumspotenzial dar. Unsere Analyse zeigt klare Nachfrage nach unserer Lösung mit günstigen Marktbedingungen, Wettbewerbsvorteilen und einem klaren Weg zur Marktdurchdringung.`;
}

function generateFinancialProjectionsDE(_programType: string, _context: any, _tone: string): string {
  return `Unser Finanzmodell zeigt starke Unit Economics mit einem klaren Weg zur Rentabilität. Umsatzprognosen zeigen nachhaltiges Wachstum über die nächsten 3-5 Jahre, unterstützt durch realistische Annahmen und Marktvalidierung.`;
}

function generateTeamSectionDE(_programType: string, _context: any, _tone: string): string {
  return `Unser erfahrenes Team vereint vielfältige Expertise in Technologie, Geschäftsentwicklung und Marktstrategie. Wir haben die Fähigkeiten, Leidenschaft und Erfolgsbilanz, um unsere Vision umzusetzen und Ergebnisse zu liefern.`;
}

function generateImplementationPlanDE(_programType: string, _context: any, _tone: string): string {
  return `Unser Umsetzungsplan skizziert klare Meilensteine, Zeitpläne und Liefergegenstände. Wir haben Schlüsselrisiken und Minderungsstrategien identifiziert, um eine erfolgreiche Projektumsetzung zu gewährleisten.`;
}

function generateRisksSectionDE(_programType: string, _context: any, _tone: string): string {
  return `Wir haben Schlüsselrisiken identifiziert, einschließlich Marktwettbewerb, regulatorische Änderungen und Umsetzungsherausforderungen. Unsere Minderungsstrategien umfassen Diversifizierung, Compliance-Überwachung und Notfallplanung.`;
}

function generateGenericContent(_section: string, programType: string, _context: any, _tone: string, _language: string): string {
  return `This section requires detailed content specific to your ${programType} application. Please provide more specific information about your business, market, and goals to generate relevant content.`;
}

function generateSuggestions(section: string, _programType: string): string[] {
  const baseSuggestions = [
    "Consider adding more specific details and metrics",
    "Include relevant industry data and benchmarks",
    "Address potential concerns and risks upfront"
  ];

  const sectionSpecific = {
    executive_summary: ["Highlight key value proposition", "Include funding amount and timeline"],
    business_description: ["Detail unique selling points", "Explain business model clearly"],
    market_analysis: ["Add market size data", "Include competitive analysis"],
    financial_projections: ["Provide detailed assumptions", "Include sensitivity analysis"],
    team: ["Highlight relevant experience", "Show team structure and roles"]
  };

  return [...baseSuggestions, ...(sectionSpecific[section as keyof typeof sectionSpecific] || [])];
}

function generateCitations(programType: string, _language: string): string[] {
  const baseCitations = [
    "Program guidelines and requirements",
    "Industry best practices and standards"
  ];

  const programSpecific = {
    grant: ["Grant program criteria", "Innovation requirements"],
    loan: ["Bank lending criteria", "Financial performance standards"],
    equity: ["Investor expectations", "Market validation data"],
    visa: ["Immigration requirements", "Business eligibility criteria"]
  };

  return [...baseCitations, ...(programSpecific[programType as keyof typeof programSpecific] || [])];
}
