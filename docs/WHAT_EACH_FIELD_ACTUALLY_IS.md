# What Each Scraped Field Actually Is

## The Data Structure

```typescript
ScrapedProgram {
  // METADATA (items 1-2, 5-6)
  name: string;                    // Item 1
  description: string;             // Item 1
  institution: string;             // Item 1
  funding_amount_min/max: number;  // Item 2
  contact_info: {email, phone};    // Item 5
  confidence_score: number;        // Item 6
  
  // ELIGIBILITY CRITERIA (item 3)
  // ← "Who is eligible to apply"
  eligibility_criteria: {
    location: "Austria",
    min_team_size: 2,
    max_company_age: 5,
    revenue_max: 500000
  }
  
  // REQUIREMENTS (item 4)
  // ← "What documents/materials are needed to apply"
  requirements: {
    business_plan: { required: true },
    pitch_deck: { required: true },
    financial_projections: { required: true }
  }
}
```

## Clear Breakdown

### Items 1-2, 5-6: Program Metadata
**Not requirements, just information about the program**

1. **Basic Info** (Item 1) - What is this program?
   - name, description, institution, source_url
   
2. **Funding Info** (Item 2) - How much money?
   - funding_amount_min/max, deadline
   
5. **Contact Info** (Item 5) - How to reach them?
   - email, phone, website
   
6. **Confidence** (Item 6) - How reliable is the data?
   - confidence_score

### Item 3: Eligibility Criteria
**WHO can apply - NOT requirements!**

This answers: "Am I eligible?"
- Location requirement (Austria, EU, International)
- Company age requirement (e.g., must be < 5 years old)
- Team size requirement (e.g., min 2 people)
- Revenue requirement (e.g., max €500k)
- Other eligibility rules

**Used by:** QuestionEngine to filter programs and generate questions

### Item 4: Requirements
**WHAT you need to provide - These ARE requirements!**

This answers: "What do I need to submit?"
- business_plan
- pitch_deck
- financial_projections
- market_analysis
- team_information
- technical_documentation
- legal_documents
- etc.

**Used by:** Editor to generate document templates

## The Key Difference

**Eligibility Criteria = "Am I eligible?"**
- Filters programs (like: "Only startups in Austria under 5 years old")

**Requirements = "What do I need to provide?"**
- Generates document templates (like: "You need a business plan")

## Example to Illustrate

**Program:** AWS Preseed Grant

**eligibility_criteria** (Who can apply):
```json
{
  "location": "Austria",           // You must be in Austria
  "min_team_size": 2,              // You must have at least 2 people
  "max_company_age": 5,            // Your company must be < 5 years old
  "revenue_max": 500000            // Your revenue must be < €500k
}
```

**requirements** (What to provide):
```json
{
  "business_plan": { required: true },     // Provide business plan
  "pitch_deck": { required: true },        // Provide pitch deck
  "financial_projections": { required: true }  // Provide financial projections
}
```

## Usage in the System

### Eligibility Criteria → QuestionEngine
```
eligibility_criteria.location = "Austria"
  ↓
QuestionEngine generates: "Where is your company located?"
  ↓
User answers: "Austria"
  ↓
Programs filtered: Keep only Austria programs
```

### Requirements → Editor
```
requirements.business_plan = true
  ↓
Editor shows: "Business Plan" section
  ↓
AI helps user write it
```

## Summary

- Items 1-2, 5-6 = Metadata (program info)
- Item 3 = **Eligibility Criteria** (who can apply)
- Item 4 = **Requirements** (what to provide)

So only **item 4 is requirements**.

But both item 3 and item 4 are important:
- **Item 3** (eligibility_criteria) = Used by wizard/questions to filter programs
- **Item 4** (requirements) = Used by editor to generate documents

The bug was that item 3 was set to `{}` (empty), which meant QuestionEngine had no data to generate questions from!

