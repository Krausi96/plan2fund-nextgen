# Plan2Fund - Comprehensive Project Description

## Overview

Plan2Fund is a comprehensive funding platform designed to help Austrian and EU entrepreneurs find funding opportunities and create professional business plans. The platform combines intelligent program matching, document generation, and business planning tools to streamline the funding application process.

## Architecture & Technology Stack

### Core Technologies
- **Framework**: Next.js 14 (Pages Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Database**: PostgreSQL (planned), currently JSON-based
- **Payments**: Stripe integration
- **Email**: Resend integration
- **Analytics**: Custom analytics + Google Analytics 4
- **Internationalization**: Custom i18n system (EN/DE)

### Key Features
- **Authless MVP**: Pseudonymous sessions using `pf_session`
- **Feature Flags**: CHECKOUT_ENABLED, EXPORT_ENABLED, AI_ENABLED
- **Multi-language Support**: English and German
- **Responsive Design**: Mobile-first approach

## Page Structure & Navigation Flow

### 1. Landing Page (`/`)
**Purpose**: Main entry point and marketing page
**Key Components**:
- Hero section with target group detection
- Who It's For section (startups, SMEs, universities, banks)
- Plan Types overview
- Why Plan2Fund section
- How It Works section
- Why Austria section
- CTA Strip

**Navigation Flow**:
- `Hero` → `/reco` (recommendation wizard)
- `How It Works` → Various `/reco` routes based on step
- `CTA Strip` → `/editor` or `/reco`

### 2. Recommendation Wizard (`/reco`)
**Purpose**: Intelligent program matching system
**Key Features**:
- Dynamic question engine based on user profile
- Target group detection (startup, SME, university, bank)
- Product selection (strategy, review, submission)
- Enhanced scoring engine with doctor-like diagnostics
- Real-time eligibility checking

**Data Flow**:
- User answers → Enhanced scoring engine → Program recommendations
- Integration with analytics for user behavior tracking
- Results stored in localStorage for editor integration

### 3. Results Page (`/results`)
**Purpose**: Display program recommendations with detailed explanations
**Key Features**:
- Enhanced program results with detailed scoring
- Eligibility trace showing passed/failed criteria
- Founder-friendly explanations for program benefits
- Gap analysis with actionable recommendations
- Program comparison and selection
- Integration with editor for plan creation

**Navigation Flow**:
- Results → `/editor` (with selected program and user answers)
- Results → `/reco` (to adjust answers)

### 4. Editor (`/editor`)
**Purpose**: Comprehensive business plan creation and editing
**Key Features**:
- Program-aware document generation
- Section-based editing with real-time validation
- AI-powered content assistance
- Readiness checking against program requirements
- Financial projections and tables
- Route-specific extras (grants, banks, equity, visa)
- Add-on pack integration

**Editor Components**:
- **Left Rail**: Section navigation with status indicators
- **Center**: Main editing area with section editor
- **Right Rail**: AI chat, readiness check, formatting settings, pricing

**Data Flow**:
- Program selection → Plan template generation → Section editing → Validation → Export

### 5. Dashboard (`/dashboard`)
**Purpose**: User account management and plan overview
**Key Features**:
- Plan management (draft, in-progress, completed)
- Recommendation tracking
- Success metrics and statistics
- Quick actions for common tasks

**Data Sources**:
- localStorage for user plans and recommendations
- Analytics data for success metrics

### 6. Library (`/library`)
**Purpose**: Document library and specifications
**Key Features**:
- Comprehensive document catalog
- Document specifications and requirements
- Format hints and limitations
- Category-based organization

**Document Categories**:
- Strategy Documents (Business Model Canvas, Go-to-Market Strategy)
- Review Documents (Reviewed Business Plan, Compliance Notes)
- Core Submission Documents (Business Plan)
- Grants Companion Docs (Work Plan, Budget, CVs)
- Bank Companion Docs (Financial Model, Bank Summary)
- Investor Companion Docs (Pitch Deck, Teaser, Cap Table)
- Visa Companion Docs (Visa Plan, Founder CV)

### 7. Pricing (`/pricing`)
**Purpose**: Transparent pricing and plan selection
**Key Features**:
- Dynamic pricing based on product type and route
- Add-on pack options
- Delivery time estimates
- Feature comparisons

### 8. Additional Pages
- **About** (`/about`): Company information and mission
- **Contact** (`/contact`): Support and inquiry forms
- **FAQ** (`/faq`): Frequently asked questions
- **Legal** (`/legal`): Terms and conditions
- **Privacy** (`/privacy`): Privacy policy and GDPR compliance
- **Checkout** (`/checkout`): Payment processing
- **Thank You** (`/thank-you`): Post-purchase confirmation

## Data Flow & System Architecture

### 1. Data Sources
**Static Data**:
- `data/programs.json`: 214+ Austrian/EU funding programs
- `data/questions.json`: Dynamic question engine
- `data/templates/`: Program-specific templates (bank, grant, investor, loan, visa)
- `i18n/`: Translation files (EN/DE)

**Dynamic Data**:
- User answers and profiles
- Plan documents and progress
- Analytics and user behavior
- Payment and subscription data

### 2. Recommendation Engine
**Enhanced Scoring System**:
- **Doctor Diagnostic**: Symptom analysis and program matching
- **Derived Signals**: Automatic signal extraction from user answers
- **Eligibility Trace**: Detailed requirement checking
- **Founder-Friendly Explanations**: User-friendly benefit descriptions

**Scoring Components**:
- Hard rules (mandatory requirements)
- Soft rules (preferred criteria)
- Effort scoring (application complexity)
- Readiness assessment
- Confidence levels

### 3. Editor System
**Plan Document Structure**:
- Executive Summary
- Market Analysis
- Product/Service Description
- Team Information
- Financial Projections
- Risk Assessment
- Funding Ask

**Validation System**:
- Real-time readiness checking
- Program requirement alignment
- Section completion tracking
- Quality scoring

### 4. Analytics & Tracking
**User Journey Tracking**:
- Page views and navigation
- Wizard completion rates
- Editor usage patterns
- Conversion tracking
- Error monitoring

**Business Metrics**:
- User segmentation
- Plan completion rates
- Success metrics
- Revenue tracking

## Content Elements & Data Management

### 1. Program Data
**Structure**:
- Program metadata (name, type, jurisdiction)
- Eligibility requirements
- Funding thresholds and rates
- Deadlines and submission info
- Evidence links and documentation

**Enhancement Strategy**:
- Web scraper integration for real-time updates
- Database migration from JSON to PostgreSQL
- Caching layer with Redis
- API endpoints for dynamic data

### 2. Question Engine
**Dynamic Questions**:
- Universal questions (country, stage, size)
- Target group specific questions
- Program-specific requirements
- Conditional logic and overlays

**Question Types**:
- Single select
- Multi-select
- Text input
- Number input
- Conditional questions

### 3. Templates & Documents
**Template System**:
- Program-specific templates
- Route-specific formatting
- Language variants (DE/EN)
- Compliance requirements

**Document Generation**:
- DOCX/PDF export
- Professional formatting
- Program-specific requirements
- Quality validation

### 4. Internationalization
**Language Support**:
- English (primary)
- German (secondary)
- Context-aware translations
- SEO optimization per language

**Content Management**:
- Centralized translation files
- Dynamic content loading
- Cultural adaptation

## System Integration & APIs

### 1. Internal APIs
**Recommendation API** (`/api/recommend`):
- Enhanced scoring engine
- Program matching
- Analytics integration

**Analytics API** (`/api/analytics`):
- Event tracking
- User behavior analysis
- Conversion monitoring

**Data APIs**:
- Program data endpoints
- User profile management
- Plan document storage

### 2. External Integrations
**Payment Processing**:
- Stripe integration for secure payments
- Subscription management
- Invoice generation

**Email Services**:
- Resend for transactional emails
- Notification system
- User communication

**Analytics**:
- Google Analytics 4
- Custom analytics dashboard
- Performance monitoring

### 3. Data Flow Architecture
```
User Input → Question Engine → Enhanced Scoring → Program Recommendations
     ↓
Program Selection → Editor Integration → Plan Generation → Validation
     ↓
Document Export → Quality Check → Delivery → Success Tracking
```

## User Experience & Journey

### 1. Onboarding Flow
1. **Landing Page**: Target group detection and value proposition
2. **Recommendation Wizard**: Intelligent program matching
3. **Results Review**: Program comparison and selection
4. **Editor Setup**: Plan creation with program context
5. **Document Generation**: Professional business plan creation
6. **Success Hub**: Next steps and support

### 2. User Segmentation
**Startups**: Early-stage companies seeking funding
**SMEs**: Established businesses looking for growth capital
**Universities**: Research institutions and innovation hubs
**Banks**: Financial institutions and credit providers

### 3. Personalization Features
- Target group-specific content
- Program-aware recommendations
- Personalized pricing
- Customized document templates

## Technical Implementation

### 1. Performance Optimization
- Server-side rendering with Next.js
- Image optimization and lazy loading
- Code splitting and dynamic imports
- Caching strategies

### 2. Security & Compliance
- GDPR compliance for EU users
- Data encryption and secure storage
- Privacy controls and consent management
- Secure payment processing

### 3. Scalability & Maintenance
- Modular component architecture
- Feature flag system for gradual rollouts
- Automated testing and CI/CD
- Monitoring and error tracking

## Future Enhancements

### 1. Web Scraper Integration
- Real-time program data updates
- Automated content management
- Enhanced program coverage (500+ programs)
- Dynamic requirement tracking

### 2. AI Integration
- Enhanced content generation
- Intelligent program matching
- Automated compliance checking
- Personalized recommendations

### 3. Database Migration
- PostgreSQL integration
- Redis caching layer
- API-driven architecture
- Real-time data synchronization

## Success Metrics & KPIs

### 1. User Engagement
- Wizard completion rates
- Editor usage patterns
- Document generation success
- User retention metrics

### 2. Business Performance
- Conversion rates by segment
- Revenue per user
- Plan completion rates
- Customer satisfaction scores

### 3. Technical Metrics
- Page load times
- API response times
- Error rates
- System uptime

## Conclusion

Plan2Fund represents a comprehensive solution for Austrian and EU entrepreneurs seeking funding. The platform combines intelligent program matching, professional document generation, and user-friendly interfaces to streamline the funding application process. With its modular architecture, extensive personalization features, and focus on user experience, Plan2Fund is positioned to become the leading platform for funding discovery and business plan creation in the Austrian and EU markets.

The system's architecture supports both current functionality and future enhancements, including web scraper integration, AI-powered features, and database migration. The platform's success is measured through user engagement, business performance, and technical metrics, ensuring continuous improvement and growth.
