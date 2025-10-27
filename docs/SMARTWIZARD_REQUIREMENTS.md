# SmartWizard Requirements - Define First, Then Wire

## END GOAL: What user should see in SmartWizard

### Target: 10-15 Profound Questions

**Question Types Required:**
1. **Location** - Where are you based?
2. **Company Age** - How old is your company?
3. **Revenue** - What is your current revenue?
4. **Team Size** - How many employees?
5. **Funding Amount Needed** - How much funding do you need?
6. **Co-financing** - How much can you invest yourself? (50%, 30%, etc.)
7. **TRL Level** - How developed is your project? (TRL 1-9)
8. **Impact Type** - What impact will you create? (innovation, environmental, social, economic)
9. **Industry Focus** - What industry are you in?
10. **Consortium** - Do you have partners?
11. **Project Stage** - Idea, MVP, Revenue-generating?
12. **Use of Funds** - Equipment, Personnel, Marketing?
13. **Capex vs Opex** - Investment or operational costs?
14. **Market Size** - B2B, B2C, B2G?
15. **Target Group** - Startup, SME, Researcher?

### Question Requirements:
- ✅ Questions must be **linked** (answer to Q1 affects Q2)
- ✅ Questions must be **conditional** (skip irrelevant questions)
- ✅ Questions must be **profound** (extract deep requirements)
- ✅ Questions must **progressively filter** (narrow down program pool)
- ✅ Questions must show **context** ("10 programs available" → "3 programs available")

### Data Flow Required:

```
1. Scraper extracts deep requirements
   ↓
2. Requirements → categorized_requirements
   ↓
3. QuestionEngine analyzes ALL requirement types
   ↓
4. Auto-generates questions for each type
   ↓
5. Calculates importance based on filter power
   ↓
6. SmartWizard shows questions in order
   ↓
7. User answers → filter programs → next question
```

## CURRENT PROBLEM:

**Data → Questions → Display**

Current:
- Data: Only 3 fallback programs, NO categorized_requirements
- Questions: Only 4 basic questions generated
- Display: Shows only 4 questions

Needed:
- Data: 300+ programs WITH categorized_requirements  
- Questions: 10-15 profound questions auto-generated
- Display: Shows progressive filtering with context

