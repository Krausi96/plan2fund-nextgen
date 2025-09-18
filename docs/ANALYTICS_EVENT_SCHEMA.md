# Plan2Fund Analytics Event Schema Documentation

## **Overview**
This document defines the complete event tracking schema for Plan2Fund, including event names, parameters, and KPIs for measuring user behavior and business metrics.

## **Event Categories**

### **1. Funnel Events (Core User Journey)**

#### **Landing Page Events**
```typescript
// Event: landing_page_view
{
  event: 'landing_page_view',
  properties: {
    segment?: string,           // B2C_FOUNDER, SME_LOAN, VISA, PARTNER
    variant?: string,           // A/B test variant
    url: string,               // Current page URL
    referrer?: string,         // Traffic source
    utm_source?: string,       // Marketing attribution
    utm_campaign?: string,     // Campaign name
    utm_medium?: string        // Marketing medium
  }
}
```

#### **Onboarding Events**
```typescript
// Event: onboarding_start
{
  event: 'onboarding_start',
  properties: {
    segment: string,           // Detected or selected segment
    source: string,            // How they arrived at onboarding
    timestamp: string          // ISO timestamp
  }
}

// Event: onboarding_complete
{
  event: 'onboarding_complete',
  properties: {
    segment: string,           // Final selected segment
    programType: string,       // GRANT, LOAN, EQUITY, VISA, MIXED
    industry: string,          // Selected industry
    language: string,          // DE, EN
    experience: string,        // NEWBIE, INTERMEDIATE, EXPERT
    payerType: string,        // INDIVIDUAL, COMPANY, INSTITUTION
    completionTime: number,    // Seconds to complete
    skippedQuestions: number   // Number of questions skipped
  }
}
```

#### **Recommendation Engine Events**
```typescript
// Event: wizard_start
{
  event: 'wizard_start',
  properties: {
    mode: string,              // STRICT, EXPLORER
    userId: string,            // User identifier
    sessionId: string          // Session identifier
  }
}

// Event: wizard_complete
{
  event: 'wizard_complete',
  properties: {
    answerCount: number,       // Number of questions answered
    recommendationCount: number, // Number of recommendations returned
    hasMatches: boolean,       // Whether any programs matched
    completionTime: number,    // Seconds to complete
    mode: string,              // STRICT, EXPLORER
    programType: string        // Selected program type
  }
}

// Event: recommendation_click
{
  event: 'recommendation_click',
  properties: {
    programId: string,         // Clicked program ID
    programName: string,       // Program name
    score: number,             // Recommendation score
    position: number,          // Position in results list
    programType: string        // Grant, Loan, Equity, Visa
  }
}
```

#### **Editor Events**
```typescript
// Event: editor_start
{
  event: 'editor_start',
  properties: {
    planType: string,          // STRATEGY, UPGRADE, CUSTOM
    programId?: string,        // Target program ID
    templateId: string,        // Selected template
    userId: string
  }
}

// Event: editor_section_edit
{
  event: 'editor_section_edit',
  properties: {
    sectionId: string,         // Section being edited
    sectionTitle: string,      // Section name
    wordCount: number,         // Current word count
    timeSpent: number,         // Seconds spent editing
    userId: string
  }
}

// Event: editor_complete
{
  event: 'editor_complete',
  properties: {
    planId: string,            // Plan identifier
    completionPercentage: number, // 0-100
    wordCount: number,         // Total words written
    sectionsCompleted: number, // Number of completed sections
    totalSections: number,     // Total sections available
    timeSpent: number,         // Total editing time in seconds
    userId: string
  }
}
```

#### **Export Events**
```typescript
// Event: export_start
{
  event: 'export_start',
  properties: {
    planId: string,
    exportType: string,        // PDF, DOCX
    isPaid: boolean,           // Whether this is a paid export
    userId: string
  }
}

// Event: export_complete
{
  event: 'export_complete',
  properties: {
    planId: string,
    exportType: string,        // PDF, DOCX
    isPaid: boolean,
    fileSize?: number,         // File size in bytes
    userId: string
  }
}
```

#### **Payment Events**
```typescript
// Event: payment_start
{
  event: 'payment_start',
  properties: {
    amount: number,            // Amount in cents
    currency: string,          // EUR, USD, etc.
    planId: string,
    items: Array<{             // Items being purchased
      id: string,
      name: string,
      amount: number
    }>,
    userId: string
  }
}

// Event: payment_complete
{
  event: 'payment_complete',
  properties: {
    amount: number,
    currency: string,
    planId: string,
    paymentMethod: string,     // card, bank_transfer, etc.
    stripeSessionId: string,   // Stripe session ID
    userId: string
  }
}

// Event: addon_purchase
{
  event: 'addon_purchase',
  properties: {
    addOnType: string,         // team_cv, expert_review, etc.
    amount: number,
    planId: string,
    userId: string
  }
}
```

### **2. Success Hub Events**

```typescript
// Event: success_hub_view
{
  event: 'success_hub_view',
  properties: {
    planId: string,
    userId: string
  }
}

// Event: next_step_click
{
  event: 'next_step_click',
  properties: {
    stepType: string,          // ffg_ecall, bank_appointment, etc.
    planId: string,
    userId: string
  }
}

// Event: testimonial_submit
{
  event: 'testimonial_submit',
  properties: {
    planId: string,
    rating: number,            // 1-5 stars
    feedback?: string,         // Optional text feedback
    userId: string
  }
}
```

### **3. Error and Performance Events**

```typescript
// Event: error_occurred
{
  event: 'error_occurred',
  properties: {
    errorMessage: string,      // Error message
    errorStack?: string,       // Stack trace
    context: string,           // Where error occurred
    url: string,               // Current page URL
    userId?: string
  }
}

// Event: performance_metric
{
  event: 'performance_metric',
  properties: {
    metric: string,            // page_load_time, api_response_time, etc.
    value: number,             // Metric value
    context?: string,          // Additional context
    userId?: string
  }
}
```

### **4. A/B Testing Events**

```typescript
// Event: experiment_view
{
  event: 'experiment_view',
  properties: {
    experimentId: string,      // LANDING_PAGE_HERO, etc.
    variant: string,           // control, treatment_a, etc.
    userId: string
  }
}

// Event: experiment_conversion
{
  event: 'experiment_conversion',
  properties: {
    experimentId: string,
    variant: string,
    conversionType: string,    // signup, purchase, export, etc.
    userId: string
  }
}
```

## **Key Performance Indicators (KPIs)**

### **Funnel Conversion Rates**
- **Landing → Onboarding**: Target ≥20%
- **Onboarding → Wizard**: Target ≥70%
- **Wizard → Results**: Target ≥80%
- **Results → Editor**: Target ≥50%
- **Editor → Export**: Target ≥30%
- **Export → Payment**: Target 5-20% (segment dependent)

### **Revenue Metrics**
- **Average Revenue Per User (ARPU)**: By segment
- **Conversion Rate**: Free to paid
- **Add-on Attach Rate**: Target ≥15%
- **Customer Lifetime Value (CLV)**

### **User Engagement**
- **Session Duration**: Average time on site
- **Pages Per Session**: Navigation depth
- **Return Rate**: Users who come back
- **Completion Rate**: Plan completion percentage

### **Quality Metrics**
- **Error Rate**: <1% of all events
- **API Response Time**: <2.5s for all endpoints
- **Page Load Time**: <3s for all pages
- **User Satisfaction**: NPS score from testimonials

## **Data Collection Guidelines**

### **Privacy Compliance**
- All events include pseudonymous user IDs
- No PII in event properties
- GDPR-compliant data retention
- User consent for analytics tracking

### **Data Quality**
- All events validated before storage
- Required properties enforced
- Data freshness monitoring
- Duplicate event prevention

### **Storage and Retention**
- Events stored in Airtable EventLogs table
- 2-year retention for business events
- 30-day retention for performance events
- User data deletion capability

## **Implementation Status**
- ✅ Event tracking implemented in `src/lib/analytics.ts`
- ✅ All funnel events tracked
- ✅ Error and performance monitoring
- ✅ A/B testing framework
- ✅ GDPR compliance built-in
