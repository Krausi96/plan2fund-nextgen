# Plan2Fund Complete Analysis

## 1. Project Description

**Plan2Fund** is an AI-powered business planning and funding recommendation platform specifically designed for the Austrian and EU startup ecosystem. It combines funding discovery, business plan creation, and application guidance in one integrated platform.

**Mission:** Democratize access to funding by making professional business planning accessible to every entrepreneur, regardless of their background.

**Unique Value:** Only integrated platform combining funding discovery + plan creation + application guidance for Austrian/EU programs.

---

## 2. Target Groups & Products

### Primary Target Groups

#### Solo Entrepreneurs (83% of new businesses)
- **Products:** Strategy Document (Free), Review Document (€99), Submission Document (€149)
- **Additional Services:** Pre-seed funding programs, MVP development support, market validation guidance
- **Pain Points:** Lack of business planning experience, unclear funding requirements, complex application processes

#### Small & Medium Enterprises (SMEs)
- **Products:** Review Document (€99), Submission Document (€149)
- **Additional Services:** Growth funding opportunities, market expansion programs, business development support
- **Pain Points:** Scaling challenges, complex funding landscape, resource constraints

#### Business Advisors & Consultants
- **Products:** All products + client management tools
- **Additional Services:** Professional business planning tools, program-specific guidance, client collaboration features
- **Pain Points:** Managing multiple clients, staying updated on program requirements, creating professional deliverables

### Collaboration Partners

#### Current Partners
- **Austrian Incubators:** i2b Initiative, aws (Austria Wirtschaftsservice)
- **Universities:** Research partnerships, student entrepreneurship programs
- **Banks:** Financial institution partnerships
- **Consultants:** Business advisor network

#### Target Partners
- **Accelerators:** Austrian and EU accelerators
- **Chambers of Commerce:** Regional business support
- **Government Agencies:** FFG, Wirtschaftsagentur
- **EU Programs:** Horizon Europe, EIC

---

## 3. Funding Types & Requirements

### Grant Funding (Austrian/EU)
**Requirements Beyond Business Plan:**
- Work packages & timeline
- Budget planning sheets
- CVs and team profiles
- Market research evidence
- Legal incorporation documents
- Project management documentation
- Technical specifications
- Environmental impact assessments

### Bank Loans
**Requirements Beyond Business Plan:**
- Financial statements (3 years)
- Bank statements
- Collateral documentation
- Personal guarantees
- Credit history
- Business registration documents
- Insurance certificates
- Repayment schedules

### Equity Investment
**Requirements Beyond Business Plan:**
- Investor teaser one-pager
- Basic cap table
- Legal incorporation documents
- Intellectual property documentation
- Financial projections (5 years)
- Market analysis
- Competitive analysis
- Exit strategy

### Visa Applications (RWR)
**Requirements Beyond Business Plan:**
- Personal documentation
- Educational certificates
- Work experience proof
- Language certificates
- Health insurance
- Criminal background check
- Financial proof of funds
- Accommodation proof

### AMS (Labor Market)
**Requirements Beyond Business Plan:**
- Job creation plan
- Training programs
- Salary structure
- Employment contracts
- Social security documentation
- Work permit applications
- Integration measures

---

## 4. Template System & Document Creation

### Current Templates

#### Strategy Template
- **Sections:** 16 sections (BMC + GTM)
- **Output:** 4-8 pages, watermarked
- **Target:** Solo entrepreneurs, idea stage
- **Documents Created:** Business Model Canvas, GTM strategy, Executive One-Pager

#### Submission Template
- **Sections:** 9 core sections + route-specific extras
- **Output:** 15-35 pages, professional format
- **Target:** All funding routes
- **Documents Created:** Full business plan, financial tables, route-specific documents

#### Review Template
- **Sections:** Inherits from submission template
- **Output:** Improved existing content
- **Target:** Existing business plans
- **Documents Created:** Updated business plan, gap analysis, recommendations

### Route-Specific Adjustments

#### Grant Route
- **Additional Sections:** Work packages & timeline, budget planning
- **Documents:** Project timeline, budget sheets, annex guidance
- **Formatting:** EU program standards, specific requirements

#### Bank Route
- **Additional Sections:** Bank summary page, repayment analysis
- **Documents:** Financial ratios, collateral documentation, repayment schedules
- **Formatting:** Banking standards, financial focus

#### Equity Route
- **Additional Sections:** Investor teaser, cap table
- **Documents:** Pitch deck, financial projections, market analysis
- **Formatting:** Investor standards, growth focus

#### Visa Route
- **Additional Sections:** Visa annex guidance
- **Documents:** Personal documentation checklist, integration plan
- **Formatting:** Immigration standards, personal focus

#### AMS Route
- **Additional Sections:** AMS annex guidance
- **Documents:** Job creation plan, training programs
- **Formatting:** Labor market standards, employment focus

---

## 5. Recommendation Technology Analysis

### Current Technology
- **Rule-Based Engine:** Programs.json with overlays and scoring
- **Scoring Algorithm:** Multi-dimensional (fit 40%, readiness 30%, effort 20%, confidence 10%)
- **Question Engine:** 10 core questions with conditional branching
- **Derived Signals:** Automatic business context extraction

### Accuracy Assessment
**Current Strengths:**
- Fast and reliable
- Transparent scoring
- Easy to maintain
- No API costs

**Current Limitations:**
- Limited to predefined rules
- Cannot handle complex program requirements
- No learning from user feedback
- Static program database

### Better Alternatives
**LLM Integration:**
- **Pros:** Better understanding of complex requirements, learning capability, dynamic responses
- **Cons:** API costs, latency, reliability issues
- **Recommendation:** Hybrid approach - LLM for complex cases, rule-based for standard cases

**Enhanced Rule Engine:**
- **Pros:** More sophisticated rules, better program parsing, dynamic updates
- **Cons:** Still limited by rule complexity
- **Recommendation:** Implement as Phase 2 improvement

---

## 6. Communication Analysis

### Landing Page Communication
**Current Issues:**
- Generic messaging across all personas
- Weak value propositions
- Poor social proof
- Unclear product differentiation

**Missing Elements:**
- Persona-specific messaging
- Success stories and case studies
- Clear product benefits
- Trust signals and testimonials

### Pricing Page Communication
**Current Issues:**
- Route multipliers not well explained
- Add-on pack confusing
- Value proposition weak
- No comparison with competitors

**Missing Elements:**
- Clear route explanations
- Value-based pricing justification
- Competitor comparisons
- ROI calculations

### About Page Communication
**Current Issues:**
- Generic feature list
- Weak statistics
- No team information
- Poor trust signals

**Missing Elements:**
- Team profiles and expertise
- Real success stories
- Industry recognition
- Client testimonials

---

## 7. Editor Capability Analysis

### Current Capabilities
**Document Creation:**
- Business plans (all types)
- Financial tables and projections
- Route-specific documents
- Multi-language support (DE/EN)
- Professional formatting

**Customization:**
- Block-based editing
- Template selection
- Route-specific content
- Tone and language adjustment
- Export formats (PDF/DOCX)

### Missing Capabilities
**Advanced Features:**
- Real-time collaboration
- Version control
- Advanced financial modeling
- Custom document types
- API integrations

**User Experience:**
- Mobile optimization
- Offline editing
- Advanced search
- AI assistance
- Workflow automation

---

## 8. Add-on Analysis

### Current Add-on Pack
**Price:** +€39
**Includes:**
- Rush delivery (3 business days)
- One extra revision
- Provider form help

### Target Group Adjustments Needed

#### Solo Entrepreneurs
**Additional Add-ons:**
- Mentoring session (€50)
- Legal consultation (€100)
- Market research support (€75)

#### SMEs
**Additional Add-ons:**
- Team collaboration (€25/month)
- Advanced analytics (€50/month)
- Custom reporting (€100)

#### Advisors
**Additional Add-ons:**
- Client management (€50/month)
- White-label options (€200/month)
- Advanced collaboration (€100/month)

---

## 9. Technical Architecture

### File Structure
```
plan2fund-nextgen/
├── pages/ (Next.js pages)
│   ├── index.tsx (Landing page)
│   ├── pricing.tsx (Pricing page)
│   ├── about.tsx (About page)
│   ├── reco.tsx (Recommendation wizard)
│   ├── editor.tsx (Main editor)
│   ├── results.tsx (Recommendation results)
│   └── for/ (Target group pages)
├── src/
│   ├── components/ (React components)
│   ├── lib/ (Core logic)
│   ├── editor/ (Editor system)
│   └── contexts/ (React contexts)
├── data/
│   ├── programs.json (26,720 lines, 50+ programs)
│   ├── questions.json (Question definitions)
│   └── templates/ (5 route-specific templates)
└── i18n/ (Internationalization)
```

### Recommendation Engine Flow
1. **User Answers** → Dynamic question engine
2. **Question Processing** → Derived signals extraction
3. **Program Matching** → Scoring algorithm
4. **Results Ranking** → Enhanced recommendations
5. **Editor Integration** → Template loading

### Editor System Flow
1. **Template Selection** → Product + route
2. **Content Creation** → Block-based editing
3. **Route Extras** → Additional documents
4. **Readiness Check** → Compliance validation
5. **Export** → PDF/DOCX generation

---

## 10. User Flows

### Flow 1: Landing → Reco → Editor
1. **Landing Page** → Hero with "Find Funding" CTA
2. **Recommendation Wizard** → 10 questions, program matching
3. **Results Page** → Program matches, scoring explanation
4. **Editor** → Pre-filled data, template loading

### Flow 2: Landing → Editor (Direct)
1. **Landing Page** → Hero with "Start Your Plan" CTA
2. **Editor** → InlineSetupBar, product/route selection
3. **Template Loading** → Based on selection
4. **Content Creation** → Block-based editing

### Flow 3: Pricing → Editor
1. **Pricing Page** → Product selection, route selection
2. **Checkout** → Stripe payment integration
3. **Editor** → Paid features unlocked

### Flow 4: Target Group → Editor
1. **Target Group Page** → Persona-specific messaging
2. **Editor** → Persona-specific templates

---

## 11. Current Content Analysis

### Landing Page Content (`pages/index.tsx`)

#### Hero Section (`src/components/common/Hero.tsx`)
**Current Headlines:**
- Main: "Freedom starts with a plan — let's create yours."
- Second: "Find funding you didn't know existed. Create a plan in <30 minutes."

**Current Subtitle:**
"Find funding options and build an application-ready Business Plan tailored to Grants, Investors or Bank Loans. Start free."

**Current CTAs:**
- Primary: "Find Programs" → `/reco`
- Secondary: "Start your plan" → `/editor`

**Current Trust Signals:**
"Trusted by 500+ founders • Built for Austrian & EU funding programs"

#### Who Its For Section (`src/components/common/WhoItsFor.tsx`)
**Current Personas:**

**Solo Entrepreneurs (Primary):**
- Title: "Solo Entrepreneurs"
- Description: "Turn your innovative ideas into reality with comprehensive business planning"
- Features: "Access pre-seed funding programs", "Create investor-ready business plans", "Get personalized funding recommendations"
- Badge: "Most Popular"
- CTA: "Start as Solo Entrepreneur" → `/reco?persona=solo`

**SMEs:**
- Title: "Small & Medium Enterprises"
- Description: "Scale your existing business with strategic funding and expansion plans"
- Features: "Find growth funding opportunities", "Access market expansion programs", "Get business development support"
- CTA: "Start as SME" → `/reco?persona=sme`

**Advisors:**
- Title: "Business Advisors & Consultants"
- Description: "Help your clients succeed with professional business planning tools"
- Features: "Access client management tools", "Create professional business plans", "Get program-specific guidance"
- CTA: "Learn More" → `/about#partners`

#### Plan Types Section (`src/components/common/PlanTypes.tsx`)
**Current Products:**

**Strategy Document (Free):**
- Title: "🧩 Strategy Document (Business Model & GTM) — 4–8 pages"
- Subtitle: "Turn your idea into a clear business model & go-to-market you can build on — upgradeable to a full plan."
- Features: "Business Model Canvas snapshot (9 blocks) with concise assumptions", "GTM essentials: target market, pricing, promotion, channels, sales tactics", "Unit economics (simple): price, unit cost, contribution margin, break-even", "Executive One-Pager (DE/EN); content carries over to the full plan"
- CTA: "Start Strategy" → `/pricing#strategy`

**Review Document (€99):**
- Title: "🔄 Update & Review (improve your existing text)"
- Subtitle: "Paste your draft — we re-structure, complete missing parts, align to requirements, and polish."
- Features: "Re-structure & completion (we add missing sections and financials)", "Readiness Check — cross-checked to grant/bank/visa/equity requirements", "Customization & formatting: DE/EN, tone, pagination, references/quotations"
- CTA: "Start Update & Review" → `/pricing#review`

**Submission Document (€149):**
- Title: "📘 Submission-Ready Business Plan — 15–35 pages"
- Subtitle: "Application-ready plan for grants, banks, visas, or equity investors — in the order reviewers expect."
- Features: "Standard sections (Executive Summary → Financials)", "Financial tables: revenue, costs, cash-flow, use of funds", "Readiness Check — cross-checked to the chosen route's requirements"
- CTA: "Start Business Plan" → `/pricing#custom`

### Pricing Page Content (`pages/pricing.tsx`)

#### Current Pricing Structure
- Strategy: €0 (Free)
- Review: €99
- Submission: €149

#### Current Route Multipliers
- Grant: 1.0x
- Bank: 1.2x
- Equity: 1.3x
- Visa: 1.1x
- AMS: 1.0x

#### Current Add-on Pack
- Price: +€39
- Includes: "Rush to first draft (target 3 business days) + one extra revision + provider form help (one standard form using your plan content)."
- Note: "Not included: legal/visa advice, additional revisions, custom modelling, portal setup. Decisions are made by providers."

### About Page Content (`pages/about.tsx`)

#### Current Features
- "Smart Matching" - "AI-powered program recommendations"
- "Professional Plans" - "Application-ready business plans"
- "Quick Setup" - "Get started in minutes, not hours"
- "Expert Guidance" - "Built-in expertise and best practices"

#### Current Statistics
- "500+ plans created"
- "€2M+ funding secured"
- "95% success rate"

### Target Group Pages (`pages/for/`)

#### Startups Page
- Title: "Built for Startups & Entrepreneurs"
- Subtitle: "Turn your innovative ideas into reality with comprehensive business planning. Access pre-seed funding, MVP development, and market validation programs."
- CTA: "Get Started" → `/editor`

#### SME Page
- Title: "Built for SMEs & Established Businesses"
- Subtitle: "Scale your existing business with strategic funding and expansion plans. Find growth funding, market expansion, and technology upgrade opportunities."
- CTA: "Get Started" → `/editor`

#### Banks Page
- Title: "Built for Banks & Financial Institutions"
- Subtitle: "Access institutional funding and partnership programs. Find large-scale funding opportunities for banks and financial institutions."
- CTA: "Learn More" → `/about#partners`

#### Universities Page
- Title: "Built for Universities & Researchers"
- Subtitle: "Access research grants and academic funding opportunities. Find funding for innovation projects, research, and student entrepreneurship programs."
- CTA: "Learn More" → `/about#partners`

---

## 12. Critical Issues & Solutions

### Content Issues
1. **Generic Messaging** - All target groups have similar, generic content
2. **Weak Value Propositions** - Features are too generic and don't differentiate
3. **Poor Social Proof** - Only basic stats, no real testimonials or case studies
4. **Unclear Product Differentiation** - Products not clearly explained per target group

### Technical Issues
1. **Mobile Optimization** - Desktop-first design, poor touch interface
2. **Performance** - Large bundle size, no lazy loading, slow page loads
3. **SEO** - Missing meta tags, no structured data, poor Core Web Vitals
4. **User Experience** - Generic CTAs, unclear navigation, weak trust signals

### Business Issues
1. **Target Group Confusion** - No clear persona differentiation
2. **Product Clarity** - Unclear what each product delivers
3. **Pricing Communication** - Route multipliers not well explained
4. **Competitive Positioning** - Weak differentiation from competitors

---

## 13. Step-by-Step Change Plan

### Landing Page Changes (`pages/index.tsx`)
**Why:** Generic messaging doesn't resonate with specific personas
**What to Change:**
- Hero headlines to be more specific and benefit-focused
- WhoItsFor section to show clear persona differentiation
- PlanTypes section to explain products better per target group
- Add real testimonials and case studies

### Pricing Page Changes (`pages/pricing.tsx`)
**Why:** Route multipliers and add-ons not well explained
**What to Change:**
- Clear explanation of why different routes cost different amounts
- Better add-on pack description with specific benefits
- Value-based pricing justification
- Competitor comparison

### About Page Changes (`pages/about.tsx`)
**Why:** Weak trust signals and generic features
**What to Change:**
- Real team profiles and expertise
- Specific success stories and case studies
- Industry recognition and client testimonials
- Clear value proposition per target group

### Target Group Pages Changes (`pages/for/`)
**Why:** All pages have generic, similar content
**What to Change:**
- Persona-specific pain points and benefits
- Specific products and services per target group
- Clear CTAs and next steps
- Success stories relevant to each persona

---

## 14. Business Questions (25 Prioritized)

### Target Group & Market Strategy
1. **Do we target the right target group?** ✅ Validated - Solo entrepreneurs (83% of new businesses), SMEs, advisors
2. **What target group would be eligible for what funding type?** Need specific mapping
3. **What do the correct funding programs require in a business plan?** Need program-specific analysis
4. **What other than a business plan do they require?** Need complete requirement analysis

### Product & Pricing Strategy
5. **Do we offer them the right products?** ✅ Validated - Freemium model with clear value tiers
6. **What of these other requirements should be included in the price and what would be add-ons?** Need pricing optimization
7. **Is pricing per target group and per product alright?** ✅ Validated - Market-aligned pricing
8. **Is the free version alright and does not give too much information but delivers value?** ✅ Validated - Good freemium balance

### Competitive Positioning
9. **Am I positioned against my competitors (especially with providers like OpenAI)?** ✅ Strong differentiation
10. **What is my competitive advantage that is not so easy to imitate?** ✅ Integrated Austrian/EU focus

### Technical Architecture & Scalability
11. **Is the recommendation engine state of the art to parse all requirements correctly?** Need LLM integration assessment
12. **What if new programs appear or we expand geographically/product-wise?** Need scalable architecture
13. **Should I prefill the editor with relevant data from reco engine?** ✅ Current implementation good
14. **Is it possible to enter the editor from all ways (outside and inside reco engine)?** ✅ 6 entry points identified

### Editor & Document Creation
15. **Do we fulfill all functions/features that result from product/target group analysis?** Need feature gap analysis
16. **Are we technically able to create these documents aligned to requirements?** Need capability assessment
17. **What do we need to do to create these?** Need implementation roadmap

### Data & Learning
18. **What kind of data do we need to save to learn about target groups?** Need data collection strategy
19. **What other than these documents would they need & how can we get to know this?** Need service expansion analysis

### Collaboration & Multi-User
20. **Shall we set up a multi-user system for universities/accelerators?** ✅ Recommended for growth

### Content & Messaging Strategy
21. **What exact content should replace the current generic messaging on each landing page section?** Need specific content changes
22. **What specific business plan structure is required for each funding type (grant, bank, equity, visa, AMS)?** Need detailed document specifications
23. **What exact features are missing from the current editor system?** Need feature gap analysis
24. **What specific algorithms should replace the current recommendation engine?** Need technical implementation details
25. **How should we communicate the value proposition differently for each target group?** Need persona-specific messaging

---

*This document provides complete analysis of Plan2Fund including project description, target groups, products, funding requirements, templates, technology, communication, editor capabilities, add-ons, technical architecture, user flows, current content, critical issues, and implementation strategy.*
