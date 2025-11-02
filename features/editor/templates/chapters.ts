export type ChapterTemplate = {
  id: string
  title: string
  hint: string
  placeholder: string
  quality?: string[]
  subchapters?: { id: string; title: string; completed: boolean }[]
}

export const chapterTemplates: ChapterTemplate[] = [
  { 
    id: "summary", 
    title: "Executive Summary", 
    hint: "Summarize your business, market, and ask.", 
    placeholder: "In one page, summarize your product, market, and funding ask...", 
    quality: ["Clear ask", "Target customer", "Why now", "Traction", "Use of funds"],
    subchapters: [
      { id: "company-overview", title: "Company Overview", completed: false },
      { id: "market-opportunity", title: "Market Opportunity", completed: false },
      { id: "financial-highlights", title: "Financial Highlights", completed: false },
      { id: "team-credentials", title: "Team Credentials", completed: false },
      { id: "funding-ask", title: "Funding Ask", completed: false }
    ]
  },
  { 
    id: "problem", 
    title: "Problem", 
    hint: "What pain point exists and for whom?", 
    placeholder: "Describe the problem and affected customer segment...", 
    quality: ["Quantify pain", "Customer quotes", "Frequency", "Alternatives", "Willingness to pay"],
    subchapters: [
      { id: "problem-statement", title: "Problem Statement", completed: false },
      { id: "target-customers", title: "Target Customers", completed: false },
      { id: "pain-quantification", title: "Pain Quantification", completed: false },
      { id: "current-solutions", title: "Current Solutions", completed: false },
      { id: "market-opportunity", title: "Market Opportunity", completed: false }
    ]
  },
  { 
    id: "solution", 
    title: "Solution", 
    hint: "How do you solve it? What is unique?", 
    placeholder: "Explain your solution, differentiation, and value proposition...", 
    quality: ["Unique angle", "Core features", "IP/moat", "Demo", "Outcomes"],
    subchapters: [
      { id: "solution-overview", title: "Solution Overview", completed: false },
      { id: "key-features", title: "Key Features", completed: false },
      { id: "differentiation", title: "Differentiation", completed: false },
      { id: "technology", title: "Technology", completed: false },
      { id: "value-proposition", title: "Value Proposition", completed: false }
    ]
  },
  { 
    id: "market", 
    title: "Market", 
    hint: "Size, growth, ICP, competitors.", 
    placeholder: "Outline TAM/SAM/SOM, ICP, and key competitors...", 
    quality: ["TAM/SAM/SOM", "ICP clarified", "Top 3 competitors", "Differentiation", "Growth rates"],
    subchapters: [
      { id: "market-size", title: "Market Size (TAM/SAM/SOM)", completed: false },
      { id: "target-segments", title: "Target Segments", completed: false },
      { id: "customer-personas", title: "Customer Personas", completed: false },
      { id: "competitive-analysis", title: "Competitive Analysis", completed: false },
      { id: "market-trends", title: "Market Trends", completed: false }
    ]
  },
  { 
    id: "gtm", 
    title: "Go-To-Market", 
    hint: "Acquisition channels, pricing, funnel.", 
    placeholder: "Detail channels, pricing strategy, and sales funnel...", 
    quality: ["Primary channel", "CAC/LTV", "Pricing tiers", "Sales funnel", "Partnerships"],
    subchapters: [
      { id: "marketing-strategy", title: "Marketing Strategy", completed: false },
      { id: "sales-strategy", title: "Sales Strategy", completed: false },
      { id: "pricing-model", title: "Pricing Model", completed: false },
      { id: "distribution-channels", title: "Distribution Channels", completed: false },
      { id: "partnerships", title: "Partnerships", completed: false }
    ]
  },
  { 
    id: "ops", 
    title: "Operations", 
    hint: "Team, processes, suppliers.", 
    placeholder: "Describe team roles, processes, and suppliers...", 
    quality: ["Key roles", "Hiring plan", "Critical suppliers", "Processes", "KPIs"],
    subchapters: [
      { id: "team-structure", title: "Team Structure", completed: false },
      { id: "key-personnel", title: "Key Personnel", completed: false },
      { id: "hiring-plan", title: "Hiring Plan", completed: false },
      { id: "operational-processes", title: "Operational Processes", completed: false },
      { id: "suppliers-vendors", title: "Suppliers & Vendors", completed: false }
    ]
  },
  { 
    id: "risks", 
    title: "Risks", 
    hint: "Top 3 risks and mitigations.", 
    placeholder: "List major risks and how you mitigate them...", 
    quality: ["Top risks", "Mitigation plan", "Dependencies", "Regulatory", "Operational"],
    subchapters: [
      { id: "market-risks", title: "Market Risks", completed: false },
      { id: "technology-risks", title: "Technology Risks", completed: false },
      { id: "financial-risks", title: "Financial Risks", completed: false },
      { id: "operational-risks", title: "Operational Risks", completed: false },
      { id: "mitigation-strategies", title: "Mitigation Strategies", completed: false }
    ]
  },
  { 
    id: "milestones", 
    title: "Milestones", 
    hint: "Roadmap next 6-12 months.", 
    placeholder: "Provide timeline with milestones and KPIs...", 
    quality: ["Timeline", "KPIs", "Critical path", "Budget", "Owners"],
    subchapters: [
      { id: "short-term-goals", title: "Short-term Goals (3-6 months)", completed: false },
      { id: "medium-term-goals", title: "Medium-term Goals (6-12 months)", completed: false },
      { id: "long-term-vision", title: "Long-term Vision (1-3 years)", completed: false },
      { id: "key-metrics", title: "Key Metrics & KPIs", completed: false },
      { id: "success-criteria", title: "Success Criteria", completed: false }
    ]
  },
  { 
    id: "financials", 
    title: "Financials", 
    hint: "Revenue model and key assumptions.", 
    placeholder: "Summarize model, assumptions, and cash needs...", 
    quality: ["Model type", "Key assumptions", "Runway", "Break-even", "Sensitivity"],
    subchapters: [
      { id: "revenue-model", title: "Revenue Model", completed: false },
      { id: "financial-projections", title: "Financial Projections", completed: false },
      { id: "key-assumptions", title: "Key Assumptions", completed: false },
      { id: "funding-requirements", title: "Funding Requirements", completed: false },
      { id: "use-of-funds", title: "Use of Funds", completed: false }
    ]
  },
]


