# Plan2Fund Current Content Analysis for GPT-5

## 1. Current Landing Page Content (`pages/index.tsx`)

### Hero Section (`src/components/common/Hero.tsx`)
**Current Headlines:**
- Main: "Freedom starts with a plan — let's create yours."
- Second: "Find funding you didn't know existed. Create a plan in <30 minutes."

**Current Subtitle:**
"Find funding options and build an application-ready Business Plan tailored to Grants, Investors or Bank Loans. Start free."

**Current CTAs:**
- Primary: "Find Programs" → `/reco`
- Secondary: "Start your plan" → `/editor`

**Current User Flow Steps:**
1. 💡 "Idea" - "Share your business idea"
2. 🏢 "Business" - "Define your business model"
3. 💰 "Funding" - "Find matching programs"
4. 📋 "Plan" - "Create your business plan"
5. 🚀 "Submit" - "Submit your application"

**Current Trust Signals:**
"Trusted by 500+ founders • Built for Austrian & EU funding programs"

### Who Its For Section (`src/components/common/WhoItsFor.tsx`)
**Current Personas:**

**Solo Entrepreneurs (Primary):**
- Title: "Solo Entrepreneurs"
- Description: "Turn your innovative ideas into reality with comprehensive business planning"
- Features:
  - "Access pre-seed funding programs"
  - "Create investor-ready business plans"
  - "Get personalized funding recommendations"
- Badge: "Most Popular"
- CTA: "Start as Solo Entrepreneur" → `/reco?persona=solo`

**SMEs:**
- Title: "Small & Medium Enterprises"
- Description: "Scale your existing business with strategic funding and expansion plans"
- Features:
  - "Find growth funding opportunities"
  - "Access market expansion programs"
  - "Get business development support"
- CTA: "Start as SME" → `/reco?persona=sme`

**Advisors:**
- Title: "Business Advisors & Consultants"
- Description: "Help your clients succeed with professional business planning tools"
- Features:
  - "Access client management tools"
  - "Create professional business plans"
  - "Get program-specific guidance"
- CTA: "Learn More" → `/about#partners`

### Why Plan2Fund Section (`src/components/common/WhyPlan2Fund.tsx`)
**Current Value Propositions:**
- "Smart Matching" - "AI-powered program recommendations"
- "Professional Plans" - "Application-ready business plans"
- "Quick Setup" - "Get started in minutes, not hours"
- "Expert Guidance" - "Built-in expertise and best practices"

### Plan Types Section (`src/components/common/PlanTypes.tsx`)
**Current Products:**

**Strategy Document (Free):**
- Title: "🧩 Strategy Document (Business Model & GTM) — 4–8 pages"
- Subtitle: "Turn your idea into a clear business model & go-to-market you can build on — upgradeable to a full plan."
- Features:
  - "Business Model Canvas snapshot (9 blocks) with concise assumptions"
  - "GTM essentials: target market, pricing, promotion, channels, sales tactics"
  - "Unit economics (simple): price, unit cost, contribution margin, break-even"
  - "Executive One-Pager (DE/EN); content carries over to the full plan"
- Badges: ["DE/EN", "PDF/DOCX", "Edit anytime"]
- CTA: "Start Strategy" → `/pricing#strategy`

**Review Document (€99):**
- Title: "🔄 Update & Review (improve your existing text)"
- Subtitle: "Paste your draft — we re-structure, complete missing parts, align to requirements, and polish."
- Features:
  - "Re-structure & completion (we add missing sections and financials)"
  - "Readiness Check — cross-checked to grant/bank/visa/equity requirements"
  - "Customization & formatting: DE/EN, tone, pagination, references/quotations"
- Route Extras: ["Budget sheet", "Work packages & timeline", "Annex guidance", "Bank summary", "Investor teaser & cap table"]
- CTA: "Start Update & Review" → `/pricing#review`

**Submission Document (€149):**
- Title: "📘 Submission-Ready Business Plan — 15–35 pages"
- Subtitle: "Application-ready plan for grants, banks, visas, or equity investors — in the order reviewers expect."
- Features:
  - "Standard sections (Executive Summary → Financials)"
  - "Financial tables: revenue, costs, cash-flow, use of funds"
  - "Readiness Check — cross-checked to the chosen route's requirements"
- Route Extras: ["Budget sheet", "Work packages & timeline", "Annex guidance", "Bank summary", "Investor teaser & cap table"]
- CTA: "Start Business Plan" → `/pricing#custom`

## 2. Current Pricing Page Content (`pages/pricing.tsx`)

### Pricing Structure
**Current Pricing:**
- Strategy: €0 (Free)
- Review: €99
- Submission: €149

**Current Route Multipliers:**
- Grant: 1.0x
- Bank: 1.2x
- Equity: 1.3x
- Visa: 1.1x
- AMS: 1.0x

**Current Add-on Pack:**
- Price: +€39
- Includes: "Rush to first draft (target 3 business days) + one extra revision + provider form help (one standard form using your plan content)."
- Note: "Not included: legal/visa advice, additional revisions, custom modelling, portal setup. Decisions are made by providers."

### Detailed Pricing Cards (`src/components/common/PricingDetails.tsx`)

**Submission Document (€149):**
- Title: "📘 Submission-Ready Business Plan (15–35 pages)"
- Who it's for: "Submitting to aws/FFG/Wirtschaftsagentur/EU, banks/leasing, visas (RWR), or sharing with investors"
- You provide: "Model summary (offer, customer, pricing, channels), Basic numbers (price, volumes, costs, funding need), Target route (if known)"
- You get: "Full plan in standard order (Executive Summary → Financials), Financial tables: revenue model, cost breakdown, cash-flow, use of funds, Readiness Check — cross-check to route requirements; status: Aligned / Needs fix / Missing, Customization & formatting (DE/EN) + Executive One-Pager (DE/EN)"
- Route extras: "Budget / planning sheet, Work packages & timeline, Annex guidance (CVs, market evidence), Bank summary page (ratios & repayment), Investor teaser one-pager & basic cap table"
- Outline: "Exec Summary · Problem/Solution · Market/Competition · Product/Operations · Team · GTM · Financials · Risks"
- Export: "PDF/DOCX · DE/EN · 15–35 pages"
- CTA: "Start Business Plan" → `/editor?plan=custom`

## 3. Current About Page Content (`pages/about.tsx`)

### Features Section
**Current Features:**
- "Smart Matching" - "AI-powered program recommendations"
- "Professional Plans" - "Application-ready business plans"
- "Quick Setup" - "Get started in minutes, not hours"
- "Expert Guidance" - "Built-in expertise and best practices"

### Statistics Section
**Current Stats:**
- "500+ plans created"
- "€2M+ funding secured"
- "95% success rate"

### Advantages Section
**Current Advantages:**
- "Compliance Ready" - "Meets Austrian and EU program requirements"
- "Team Collaboration" - "Work together on your business plan"
- "Export Options" - "PDF, DOCX, and more formats"
- "Multi-language" - "Available in German and English"

## 4. Current Target Group Pages (`pages/for/`)

### Startups Page (`pages/for/startups.tsx`)
**Current Content:**
- Title: "Built for Startups & Entrepreneurs"
- Subtitle: "Turn your innovative ideas into reality with comprehensive business planning. Access pre-seed funding, MVP development, and market validation programs."
- Features: Generic startup features
- CTA: "Get Started" → `/editor`

### SME Page (`pages/for/sme.tsx`)
**Current Content:**
- Title: "Built for SMEs & Established Businesses"
- Subtitle: "Scale your existing business with strategic funding and expansion plans. Find growth funding, market expansion, and technology upgrade opportunities."
- Features: Generic SME features
- CTA: "Get Started" → `/editor`

### Banks Page (`pages/for/banks.tsx`)
**Current Content:**
- Title: "Built for Banks & Financial Institutions"
- Subtitle: "Access institutional funding and partnership programs. Find large-scale funding opportunities for banks and financial institutions."
- Features: Generic bank features
- CTA: "Learn More" → `/about#partners`

### Universities Page (`pages/for/universities.tsx`)
**Current Content:**
- Title: "Built for Universities & Researchers"
- Subtitle: "Access research grants and academic funding opportunities. Find funding for innovation projects, research, and student entrepreneurship programs."
- Features: Generic university features
- CTA: "Learn More" → `/about#partners`

## 5. Current Issues Identified

### Content Issues
1. **Generic Messaging** - All target groups have similar, generic content
2. **Weak Value Propositions** - Features are too generic and don't differentiate
3. **Poor Social Proof** - Only basic stats, no real testimonials or case studies
4. **Unclear Pricing** - Route multipliers not well explained
5. **Weak CTAs** - Generic "Get Started" buttons everywhere

### SEO Issues
1. **Missing Meta Tags** - No specific meta descriptions
2. **Generic Keywords** - No targeted keywords per page
3. **No Structured Data** - Missing schema markup
4. **Poor Internal Linking** - Weak page relationships

### Mobile Issues
1. **Desktop-First Design** - Not optimized for mobile
2. **Poor Touch Interface** - Buttons too small, hard to tap
3. **Long Forms** - Recommendation wizard not mobile-friendly
4. **Slow Loading** - Large images and animations

### Performance Issues
1. **Large Bundle Size** - No code splitting
2. **No Lazy Loading** - All content loads at once
3. **Poor Caching** - No proper cache headers
4. **Slow Page Loads** - No optimization

---

## 6. What GPT-5 Needs to Deliver

### Strategic Analysis
- Answer all 20 business questions based on research
- Validate target groups, products, pricing strategy
- Assess competitive positioning and differentiation
- Recommend strategic changes

### Content Changes
For each page, specify exactly what to change:
- **Landing Page:** Specific headlines, value props, CTAs, social proof
- **Pricing Page:** Structure, route comparison, add-ons, value messaging
- **About Page:** Features, benefits, statistics, trust signals
- **Target Group Pages:** Persona-specific messaging and pain points

### Technical Implementation
For each change, specify:
- **Exact file path** (e.g., `pages/index.tsx`)
- **Specific function/component** (e.g., `Hero` component)
- **Exact code changes** (what to add/remove/modify)
- **New files to create** (with complete content)

### Implementation Phases
- **Phase 1:** Critical fixes for go-live (0-2 weeks)
- **Phase 2:** Market validation features (1-2 months)
- **Phase 3:** Scale and expansion (2+ months)

---

*This document provides GPT-5 with the actual current content so he can give specific, actionable recommendations for improvement.*
