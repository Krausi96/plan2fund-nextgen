// ========= PLAN2FUND — TEMPLATE KNOWLEDGE BASE =========
// Extracted from German template (template_public_support_general_austria_de_i2b.txt)
// Provides deep guidance, frameworks, and best practices for each section
// Used by AI Business Expert for consulting-level analysis

export interface TemplateKnowledge {
  guidance: string; // Main guidance from German template
  requiredElements: string[]; // Required elements to include
  frameworks?: string[]; // Business frameworks to use (Porter, SWOT, SMART, etc.)
  bestPractices?: string[]; // Best practices
  commonMistakes?: string[]; // Common mistakes to avoid
  expertQuestions?: string[]; // Expert questions to consider
  validation?: string; // How to validate this section semantically
}

export const TEMPLATE_KNOWLEDGE: Record<string, TemplateKnowledge> = {
  // ============================================================================
  // EXECUTIVE SUMMARY
  // ============================================================================
  executive_summary: {
    guidance: "Wir empfehlen diese Zusammenfassung erst dann zu verfassen, wenn Sie den gesamten Businessplan erstellt haben. Es sollen die wichtigsten Inhalte aus den jeweiligen Kapiteln komprimiert dargestellt werden.",
    requiredElements: [
      "Compressed representation of most important content from all chapters",
      "Business mission and core problem",
      "Solution concept",
      "Target customers",
      "Funding amount and purpose",
      "Expected impact"
    ],
    bestPractices: [
      "Write after completing entire business plan",
      "Compress key content from all chapters",
      "Make it compelling and clear",
      "Keep it concise (max 20-30 pages total for entire plan)",
      "Write for external readers (funding bodies, incubators, banks)"
    ],
    commonMistakes: [
      "Writing before completing other sections",
      "Including too much detail",
      "Contradictions with other sections",
      "Unrealistic claims"
    ],
    expertQuestions: [
      "Does it accurately reflect all key sections?",
      "Is it compelling enough to grab attention?",
      "Are all key points (problem, solution, market, funding) covered?",
      "Is it free of contradictions?"
    ],
    validation: "Check if it compresses key content from all chapters, covers problem/solution/market/funding, and is compelling"
  },

  // ============================================================================
  // PRODUCT / SERVICE DESCRIPTION
  // ============================================================================
  product_description: {
    guidance: "Beschreiben Sie detailliert Ihr Produkt- / Dienstleistungsangebot. Wie ist der aktuelle Entwicklungsstand? Liegt bereits ein Prototyp oder Proof of Concept vor? Muss dieser erst entwickelt werden? Oder haben Sie bereits die erste Kleinserie produziert? Gibt es erste Kunden? Beschreiben Sie auch, wie Ihre Produkte oder Dienstleistungen zukunftsfit gestaltet sind und welche nachhaltigen Materialien und Prozesse verwendet werden.",
    requiredElements: [
      "Detailed product/service description",
      "Current development status (prototype, proof of concept, first production run)",
      "Initial customers (if any)",
      "Future-fit design and sustainability aspects",
      "Sustainable materials and processes used"
    ],
    bestPractices: [
      "Be specific about development stage",
      "Mention sustainability aspects",
      "Describe from customer perspective",
      "Include proof of concept or prototype status"
    ],
    commonMistakes: [
      "Vague product description",
      "Not stating development status clearly",
      "Ignoring sustainability aspects",
      "Too technical without customer benefit"
    ],
    expertQuestions: [
      "Is the development status clearly stated?",
      "Are sustainability aspects addressed?",
      "Is it described from customer perspective?",
      "Is there proof of concept or prototype?"
    ],
    validation: "Check if development status is clearly stated, product is described from customer perspective, and sustainability is addressed"
  },

  innovation_technology: {
    guidance: "Falls Sie ein innovatives Produkt oder eine innovative Dienstleistung anbieten, beschreiben Sie bitte den Innovationsgrad. Um welche Art der Innovation handelt es sich: technisch, kreativwirtschaftliche, soziale, Verfahrens- oder Prozessinnovationen? Wie hoch ist der Innovationsgrad im Vergleich zu den am Markt angebotenen Produkten/Dienstleistungen in Österreich oder auch weltweit?",
    requiredElements: [
      "Type of innovation (technical, creative, social, process, procedure)",
      "Innovation level compared to market (Austria and worldwide)",
      "Protection strategy (patents, trademarks, know-how)",
      "Current protection status"
    ],
    frameworks: ["Technology Readiness Level (TRL)"],
    bestPractices: [
      "Clearly define innovation type",
      "Compare with market offerings",
      "Explain protection strategy",
      "State current protection status"
    ],
    commonMistakes: [
      "Claiming innovation without justification",
      "Not comparing with market",
      "No protection strategy",
      "Vague innovation description"
    ],
    expertQuestions: [
      "Is the innovation type clearly defined?",
      "Is it compared with market offerings?",
      "Is there a protection strategy?",
      "What is the current protection status?"
    ],
    validation: "Check if innovation type is defined, compared with market, and protection strategy is explained"
  },

  // ============================================================================
  // MARKET ANALYSIS
  // ============================================================================
  market_analysis: {
    guidance: "Beschreiben Sie die Branche, in der Sie tätig werden wollen: Die Größe der Branche (Anzahl der Unternehmen), die Struktur der Branche (Betriebsgröße, kleinteilige Strukturen oder wenige Platzhirsche), Besonderheiten und Spielregeln (z.B. Öffnungszeiten, Gratis-Serviceleistungen, Anzahlungen, Stammkundenrabatt, Trends in Bezug auf Preise, Nachfrage. Nützliches Modell: Branchenstrukturanalyse nach Porter (Five Forces). Analysieren Sie auch die Bedeutung von Nachhaltigkeit in Ihrer Branche und wie Sie sich durch nachhaltige Praktiken von Ihren Wettbewerbern abheben.",
    requiredElements: [
      "Industry size (number of companies)",
      "Industry structure (company size, fragmented or few dominant players)",
      "Special characteristics and rules (opening hours, free services, deposits, loyalty discounts, price trends, demand)",
      "Porter Five Forces analysis",
      "Sustainability importance in industry",
      "How sustainable practices differentiate from competitors"
    ],
    frameworks: ["Porter Five Forces", "TAM/SAM/SOM"],
    bestPractices: [
      "Use Porter Five Forces framework",
      "Calculate market size with sources",
      "Analyze industry structure",
      "Address sustainability",
      "Identify market rules and characteristics"
    ],
    commonMistakes: [
      "Not using Porter Five Forces",
      "Overestimating market size without sources",
      "Vague industry structure description",
      "Ignoring sustainability",
      "Not analyzing market rules"
    ],
    expertQuestions: [
      "Is Porter Five Forces properly used?",
      "Is market size realistic and sourced?",
      "Is industry structure clearly described?",
      "Are sustainability aspects addressed?",
      "Are market rules and characteristics identified?"
    ],
    validation: "Check if Porter Five Forces is used, market size is sourced, industry structure is clear, and sustainability is addressed"
  },

  market_opportunity: {
    guidance: "Mit dem Markt ist im Unterschied zur Branche nicht die Summe der Anbieter gemeint, sondern jene der Nachfrager. Wichtige Kenngrößen sind Volumen, Preis, Umsatz und Wachstum. Basierend auf den Marktzahlen leiten Sie das Absatzpotential Ihres Unternehmens ab. Versuchen Sie plausible Einschätzungen für die Zukunft nieder zu schreiben und setzen Sie Ihr Absatzziel für die Einstiegsphase niedriger an, da die Markteroberung schrittweise erfolgen wird.",
    requiredElements: [
      "Market volume, price, revenue, and growth",
      "Sales potential based on market data",
      "Realistic future estimates",
      "Conservative entry-phase sales targets",
      "Gradual market penetration approach"
    ],
    frameworks: ["TAM/SAM/SOM", "Market Sizing"],
    bestPractices: [
      "Distinguish market (demand) from industry (supply)",
      "Use market data (volume, price, revenue, growth)",
      "Set conservative entry-phase targets",
      "Explain gradual penetration approach",
      "Base sales potential on market data"
    ],
    commonMistakes: [
      "Confusing market with industry",
      "Overestimating sales potential",
      "Unrealistic entry-phase targets",
      "No market data cited",
      "Not explaining penetration approach"
    ],
    expertQuestions: [
      "Is market (demand) distinguished from industry (supply)?",
      "Are market data (volume, price, revenue, growth) provided?",
      "Are entry-phase targets conservative?",
      "Is gradual penetration explained?",
      "Is sales potential based on market data?"
    ],
    validation: "Check if market is distinguished from industry, market data is provided, targets are conservative, and penetration approach is explained"
  },

  competitive_landscape: {
    guidance: "Vergleichen Sie Ihr Produkt / Ihre Dienstleistung mit dem Angebot der wichtigsten Mitbewerber. Nutzen Sie die Übersichtstabelle Konkurrenzanalyse auf unserer Website (unter Downloads). Eine umfassende Konkurrenzanalyse hilft Ihnen ihre Stärken und Schwächen im Vergleich zu anderen Unternehmen zu identifizieren und Ihr Angebot zu optimieren.",
    requiredElements: [
      "Comparison with main competitors",
      "Competitive analysis table",
      "Strengths and weaknesses vs competitors",
      "Offer optimization based on analysis"
    ],
    frameworks: ["Competitive Matrix", "SWOT Analysis"],
    bestPractices: [
      "Use competitive analysis table",
      "Compare with main competitors",
      "Identify strengths and weaknesses",
      "Optimize offer based on analysis"
    ],
    commonMistakes: [
      "Not analyzing competitors properly (just listing names)",
      "No competitive comparison table",
      "Not identifying strengths/weaknesses",
      "No optimization based on analysis"
    ],
    expertQuestions: [
      "Are competitors properly analyzed (not just listed)?",
      "Is a competitive analysis table used?",
      "Are strengths and weaknesses identified?",
      "Is offer optimization based on analysis?"
    ],
    validation: "Check if competitors are analyzed (not just listed), competitive table is used, and strengths/weaknesses are identified"
  },

  // ============================================================================
  // BUSINESS MODEL
  // ============================================================================
  business_model_value_proposition: {
    guidance: "Beschreiben Sie den Mehrwert, den Sie für Ihre KundInnen generieren. Nehmen Sie Ihren KundInnen Arbeit ab? Sparen Sie ihnen Zeit oder Kosten? Liefen Sie bessere Qualität? Ober überhaupt etwas Neues? Betrachten Sie Ihr Produkt / Ihre Dienstleistung aus der Sicht der KundInnen. Beschreiben Sie den \"Unique Selling Point\" (USP) Ihres Produktes / Ihrer Dienstleistung. Welche Stärken und Schwächen haben Ihre Produkte und/oder Dienstleistung im Vergleich zum Mitbewerb?",
    requiredElements: [
      "Customer value proposition",
      "Unique Selling Point (USP)",
      "Strengths and weaknesses vs competitors",
      "Customer perspective (saves time, costs, better quality, something new)",
      "Why customers should buy from you"
    ],
    frameworks: ["Value Proposition Canvas", "USP Analysis"],
    bestPractices: [
      "Describe from customer perspective",
      "Clearly state USP",
      "Compare strengths/weaknesses with competitors",
      "Explain why customers should buy from you"
    ],
    commonMistakes: [
      "Not describing from customer perspective",
      "Vague USP",
      "Not comparing with competitors",
      "Not explaining differentiation"
    ],
    expertQuestions: [
      "Is it described from customer perspective?",
      "Is USP clearly stated?",
      "Are strengths/weaknesses compared with competitors?",
      "Is differentiation explained?"
    ],
    validation: "Check if described from customer perspective, USP is clear, and strengths/weaknesses are compared with competitors"
  },

  // ============================================================================
  // TEAM & MANAGEMENT
  // ============================================================================
  team_qualifications: {
    guidance: "Welche Personen sind Teil des Gründungsteams und über welche Vorerfahrung verfügen diese Personen? Welche Rolle haben die Personen im Unternehmen? Gibt es \"Know How\" das Sie nicht im Team haben? Wenn ja, wie schließen Sie diese Lücke? Durch Vergabe an Externe? Durch Aufnahme von Personal oder zusätzlichen Gesellschaftern? Zeigen Sie auch, wie das Managementteam Nachhaltigkeit in die Unternehmensführung integriert und welche Schulungen und Maßnahmen zur Förderung nachhaltiger Praktiken durchgeführt werden.",
    requiredElements: [
      "Founding team members and their experience",
      "Roles in the company",
      "Knowledge gaps identification",
      "How to close knowledge gaps (external, hiring, partners)",
      "Sustainability integration in management",
      "Training and measures for sustainable practices"
    ],
    bestPractices: [
      "List all founding team members",
      "Describe relevant experience",
      "Identify knowledge gaps",
      "Explain how to close gaps",
      "Address sustainability in management"
    ],
    commonMistakes: [
      "Not listing all team members",
      "Vague experience description",
      "Not identifying knowledge gaps",
      "No plan to close gaps",
      "Ignoring sustainability"
    ],
    expertQuestions: [
      "Are all team members listed with experience?",
      "Are roles clearly defined?",
      "Are knowledge gaps identified?",
      "Is there a plan to close gaps?",
      "Is sustainability addressed?"
    ],
    validation: "Check if all team members are listed with experience, roles are defined, knowledge gaps are identified, and sustainability is addressed"
  },

  // ============================================================================
  // FINANCIAL PLANNING
  // ============================================================================
  financial_plan: {
    guidance: "Wie hoch ist Ihr Gesamtkapitalbedarf aufgrund der zuvor durchgeführten Berechnungen? Welche Finanzierungsquellen können Sie zur Deckung des Finanzbedarfs verwenden? Neben den Gründungskosten wie z.B. Anwalts- und Steuerkosten fallen Investitionen an um Ihr Unternehmen überhaupt in Betrieb zu setzen. Welche Investitionen sind notwendig, um erste Umsätze zu erzielen? Beschreiben Sie auch, wie nachhaltige Investitionen und Technologien langfristige Kosteneinsparungen und Effizienzsteigerungen ermöglichen. Berücksichtigen Sie ökologische und soziale Risiken in Ihrer Finanzplanung.",
    requiredElements: [
      "Total capital requirement",
      "Financing sources",
      "Startup costs (legal, tax, etc.)",
      "Investment costs to start operations",
      "Investments needed for first revenue",
      "Sustainable investments and technologies",
      "Long-term cost savings and efficiency gains",
      "Ecological and social risks in financial planning"
    ],
    frameworks: ["Financial Projections", "Cost Breakdown", "Funding Sources"],
    bestPractices: [
      "Calculate total capital requirement",
      "List all financing sources",
      "Include startup and investment costs",
      "Address sustainable investments",
      "Consider ecological and social risks"
    ],
    commonMistakes: [
      "Unrealistic capital requirements",
      "Missing financing sources",
      "Not including all costs",
      "Ignoring sustainability",
      "Not considering risks"
    ],
    expertQuestions: [
      "Is total capital requirement realistic?",
      "Are all financing sources listed?",
      "Are all costs included?",
      "Are sustainable investments addressed?",
      "Are ecological and social risks considered?"
    ],
    validation: "Check if capital requirement is realistic, financing sources are listed, all costs are included, and sustainability/risks are addressed"
  },

  preliminary_financial_overview: {
    guidance: "Mit welchen Produktionskosten bzw. Wareneinsatz rechnen Sie? Mit welchen sonstigen laufenden Kosten rechnen Sie? Welchen Personalbedarf und welche Personalkosten erwarten Sie? Wie hoch ist Ihr Unternehmerlohn? (Kosten innerhalb der nächsten 3-5 Geschäftsjahre.) Beachten Sie auch die Sozialversicherungsbeiträge und die Abgaben ans Finanzamt. Anhand Ihres ermittelten Absatzpotential in Kapitel 3.2. Markt und Absatzpotential können Sie die Ihren Absatz/Umsatz planen. Die Planung muss realistisch und nachvollziehbar sein.",
    requiredElements: [
      "Production costs / cost of goods",
      "Other operating costs",
      "Personnel requirements and costs",
      "Entrepreneur salary",
      "Social security contributions",
      "Tax obligations",
      "Sales/revenue planning based on sales potential",
      "Realistic and comprehensible planning"
    ],
    frameworks: ["Cost Breakdown", "Revenue Projections", "P&L Statement"],
    bestPractices: [
      "Break down all costs",
      "Include personnel and entrepreneur salary",
      "Consider social security and taxes",
      "Base revenue on sales potential",
      "Keep planning realistic and comprehensible"
    ],
    commonMistakes: [
      "Missing cost categories",
      "Forgetting social security and taxes",
      "Unrealistic revenue projections",
      "Not based on sales potential",
      "Incomprehensible planning"
    ],
    expertQuestions: [
      "Are all costs included?",
      "Are social security and taxes considered?",
      "Are revenue projections realistic?",
      "Is planning based on sales potential?",
      "Is planning comprehensible?"
    ],
    validation: "Check if all costs are included, revenue is realistic and based on sales potential, and planning is comprehensible"
  },

  // ============================================================================
  // RISK ASSESSMENT
  // ============================================================================
  risk_assessment: {
    guidance: "Gibt es rechtliche, wirtschaftliche oder regionale etc. Markteintrittsbarrieren und wie wollen Sie damit umgehen? Bestehen Abhängigkeiten zu Lieferanten, Kunden oder Mitbewerbern wie z.B., dass nur ein Produktionsunternehmen Ihr Produkt erstellen kann?",
    requiredElements: [
      "Market entry barriers (legal, economic, regional)",
      "How to handle barriers",
      "Dependencies on suppliers, customers, or competitors",
      "Risk mitigation strategies"
    ],
    frameworks: ["Risk Matrix", "SWOT Analysis"],
    bestPractices: [
      "Identify all market entry barriers",
      "Explain how to handle barriers",
      "Identify dependencies",
      "Provide mitigation strategies"
    ],
    commonMistakes: [
      "Not identifying barriers",
      "No plan to handle barriers",
      "Not identifying dependencies",
      "No mitigation strategies"
    ],
    expertQuestions: [
      "Are all barriers identified?",
      "Is there a plan to handle barriers?",
      "Are dependencies identified?",
      "Are mitigation strategies provided?"
    ],
    validation: "Check if barriers are identified, there's a plan to handle them, dependencies are identified, and mitigation strategies are provided"
  },

  // ============================================================================
  // MARKETING & SALES
  // ============================================================================
  go_to_market: {
    guidance: "Stellen Sie Ihre Marketingstrategie mit den daraus abgeleiteten Marketingmaßen (inkl. Markteintrittsstrategie dar. Welche Kommunikationskanäle und Werbemittel wollen Sie nutzen? Erläutern Sie auch, wie Nachhaltigkeit in Ihre Marketing- und Vertriebsstrategien integriert ist und wie Sie Ihre nachhaltigen Initiativen kommunizieren. Stellen Sie Ihre Vertriebsstrategie mit den daraus abgeleiteten vertrieblichen Maßnahmen dar. Wie wollen Sie Ihr Produkt / Ihre Dienstleistung verkaufen (Online Shop, Geschäftslokal, über Dritte, ….)?",
    requiredElements: [
      "Marketing strategy and measures",
      "Market entry strategy",
      "Communication channels and advertising",
      "Sustainability in marketing and sales",
      "How to communicate sustainable initiatives",
      "Sales strategy and measures",
      "Sales channels (online shop, physical location, third parties)"
    ],
    frameworks: ["Go-to-Market Strategy", "Marketing Mix"],
    bestPractices: [
      "Define marketing strategy",
      "Identify communication channels",
      "Address sustainability",
      "Define sales channels",
      "Explain market entry strategy"
    ],
    commonMistakes: [
      "Vague marketing strategy",
      "No communication channels defined",
      "Ignoring sustainability",
      "No sales channels defined",
      "No market entry strategy"
    ],
    expertQuestions: [
      "Is marketing strategy clearly defined?",
      "Are communication channels identified?",
      "Is sustainability addressed?",
      "Are sales channels defined?",
      "Is market entry strategy explained?"
    ],
    validation: "Check if marketing and sales strategies are defined, channels are identified, and sustainability is addressed"
  },

  // ============================================================================
  // TIMELINE & MILESTONES
  // ============================================================================
  timeline_milestones: {
    guidance: "Welche einzelnen Schritte haben Sie innerhalb der nächsten Jahre zur erfolgreichen Etablierung Ihres Unternehmens geplant (Personal, Standort, …)? Welche Meilensteine haben Sie festgelegt? Bis zu welchen Terminen möchten Sie Ihre Planungsmaßnahmen konkret umgesetzt haben (Fertigstellung des Produktes, Finanzierungen abgeschlossen, Gewerbeberechtigung erhalten, …)? Welche Aufgaben und Meilensteine hängen direkt voneinander ab? Welcher ist der kritische Pfad bei der Umsetzung bzw. Start-up Phase? Welche Meilensteine habe Sie für die Nachgründungsphase geplant?",
    requiredElements: [
      "Steps for company establishment (personnel, location, etc.)",
      "Milestones with dates",
      "Concrete implementation dates (product completion, financing, permits, etc.)",
      "Task and milestone dependencies",
      "Critical path for implementation/startup phase",
      "Post-founding phase milestones"
    ],
    frameworks: ["Gantt Chart", "Critical Path Method", "SMART Goals"],
    bestPractices: [
      "Define clear milestones with dates",
      "Identify dependencies",
      "Determine critical path",
      "Plan post-founding phase",
      "Set SMART goals"
    ],
    commonMistakes: [
      "Vague milestones without dates",
      "No dependencies identified",
      "No critical path",
      "Unrealistic timelines",
      "No post-founding planning"
    ],
    expertQuestions: [
      "Are milestones clearly defined with dates?",
      "Are dependencies identified?",
      "Is critical path determined?",
      "Are timelines realistic?",
      "Is post-founding phase planned?"
    ],
    validation: "Check if milestones have dates, dependencies are identified, critical path is determined, and timelines are realistic"
  },

  // ============================================================================
  // COMPANY & SWOT
  // ============================================================================
  project_description: {
    guidance: "Was sind die Kernaufgaben Ihres Unternehmens? Welches Geschäftsmodell haben Sie vorgesehen? SWOT-Analyse: Identifizieren Sie Stärken und Schwächen im Verhältnis zu Ihren Konkurrenten. Setzen Sie diese Stärken und Schwächen den Trends gegenüber, so ergeben sich Chancen und Risiken für Ihr Geschäftsmodell und leiten Sie gegebenenfalls Maßnahmen ab.",
    requiredElements: [
      "Core tasks of the company",
      "Business model",
      "SWOT Analysis (Strengths, Weaknesses, Opportunities, Threats)",
      "Measures derived from SWOT"
    ],
    frameworks: ["SWOT Analysis", "Business Model Canvas"],
    bestPractices: [
      "Define core tasks",
      "Explain business model",
      "Conduct SWOT analysis",
      "Derive measures from SWOT"
    ],
    commonMistakes: [
      "Vague core tasks",
      "No business model explanation",
      "Incomplete SWOT analysis",
      "No measures derived from SWOT"
    ],
    expertQuestions: [
      "Are core tasks clearly defined?",
      "Is business model explained?",
      "Is SWOT analysis complete?",
      "Are measures derived from SWOT?"
    ],
    validation: "Check if core tasks are defined, business model is explained, SWOT is complete, and measures are derived"
  }
};

/**
 * Get template knowledge for a section by ID
 */
export function getTemplateKnowledge(sectionId: string): TemplateKnowledge | undefined {
  return TEMPLATE_KNOWLEDGE[sectionId];
}

/**
 * Get all frameworks used across sections
 */
export function getAllFrameworks(): string[] {
  const frameworks = new Set<string>();
  Object.values(TEMPLATE_KNOWLEDGE).forEach(knowledge => {
    knowledge.frameworks?.forEach(framework => frameworks.add(framework));
  });
  return Array.from(frameworks);
}

/**
 * Get expert questions for a section
 */
export function getExpertQuestions(sectionId: string): string[] {
  return TEMPLATE_KNOWLEDGE[sectionId]?.expertQuestions || [];
}

