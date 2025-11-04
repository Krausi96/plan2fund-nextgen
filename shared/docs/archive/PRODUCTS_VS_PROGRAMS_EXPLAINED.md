# Products vs Programs - Plain English Explanation

---

## 🎯 **WHAT ARE PRODUCTS?**

**Products = Different Types of Business Plans**

Think of products as different **stages** or **purposes** of a business plan:

1. **Strategy** = Early-stage strategic plan
   - Purpose: Figure out your idea, market fit, funding options
   - Sections: 6 focused sections (Executive Summary, Market Opportunity, Business Model, Competitive Analysis, Financial Overview, Funding Fit)
   - Use: Before you write a full plan

2. **Review** = Review and improve an existing plan
   - Purpose: Check quality, find gaps, improve content
   - Sections: All sections (10 for grants, 8 for loans, etc.)
   - Use: When you already have a draft plan

3. **Submission** = Final application-ready plan
   - Purpose: Submit to a specific funding program
   - Sections: All sections + program-specific sections
   - Use: When you're ready to apply

---

## 🏛️ **WHAT ARE PROGRAMS?**

**Programs = Specific Funding Programs**

These are actual funding programs users can apply to:

- **FFG Basisprogramm** (Austrian grant)
- **AWS Preseed** (Austrian grant)
- **Horizon Europe** (EU grant)
- **Bank XYZ Loan** (Bank loan)
- **Red-White-Red Card** (Visa program)

Each program has:
- Specific requirements
- Specific sections they want to see
- Specific document formats
- Specific questions

---

## 📋 **WHAT ARE MASTER TEMPLATES?**

**Master Templates = Base Templates We Created**

These are the standard templates we created in `sections.ts`:

- **Master sections for grants** = 10 sections (Executive Summary, Project Description, Innovation, Impact, etc.)
- **Master sections for bank loans** = 8 sections
- **Master sections for equity** = 11 sections
- **Master sections for visa** = 8 sections

These are high-quality, source-verified templates based on official sources (FFG, WKO, Horizon Europe, etc.).

---

## 🔄 **HOW DO THEY WORK TOGETHER?**

### **Scenario 1: User Creates Strategy Product (No Program Selected)**

```
User selects: Product = "Strategy", Funding Type = "grants"

System uses:
- MASTER_SECTIONS.grants.strategy (6 focused sections)
- No program-specific sections (no program selected)

Result: Generic strategic plan with 6 focused sections
```

### **Scenario 2: User Creates Review Product (No Program Selected)**

```
User selects: Product = "Review", Funding Type = "grants"

System uses:
- MASTER_SECTIONS.grants.review (all 10 sections)
- No program-specific sections (no program selected)

Result: Generic review plan with all sections
```

### **Scenario 3: User Creates Submission Product (No Program Selected)**

```
User selects: Product = "Submission", Funding Type = "grants"

System uses:
- MASTER_SECTIONS.grants.submission (all 10 sections)
- No program-specific sections (no program selected)

Result: Generic submission plan with all sections
```

### **Scenario 4: User Creates Submission Product (Program Selected)**

```
User selects: Product = "Submission", Funding Type = "grants", Program = "FFG Basisprogramm"

System uses:
- MASTER_SECTIONS.grants.submission (all 10 master sections)
- Program-specific sections from database (FFG customizations)
- Merges: Program sections override master sections by ID

Result: Submission plan customized for FFG Basisprogramm
```

---

## ❓ **YOUR QUESTION: "Master template applicable to submission and maybe review?"**

**You're right!** Here's the situation:

### **Current Master Templates:**
- The templates in `MASTER_SECTIONS` are currently **full, comprehensive sections**
- They have 10 sections for grants, 8 for loans, etc.
- These are detailed and comprehensive

### **What ChatGPT Recommends:**
1. **Strategy** = 6 focused sections (different from current master)
2. **Review** = All sections (can use current master)
3. **Submission** = All sections + program-specific (can use current master + program merge)

### **The Problem:**
- Current master templates are **too detailed for Strategy**
- Strategy needs **focused, shorter sections** (150-350 words)
- Current master has **full sections** (200-900 words)

### **The Solution:**
- **Strategy** = Create new focused sections (6 sections, shorter word counts)
- **Review** = Use current master sections (all sections, existing word counts)
- **Submission** = Use current master sections + program-specific merge (all sections, existing word counts)

---

## ✅ **CLEAR SUMMARY**

### **Products (What User Creates):**
1. **Strategy** = 6 focused sections (NEW - needs to be created)
2. **Review** = All master sections (USE EXISTING MASTER)
3. **Submission** = All master sections + program-specific (USE EXISTING MASTER + PROGRAM MERGE)

### **Programs (What User Applies To):**
- FFG Basisprogramm, AWS Preseed, etc.
- Only relevant for **Submission** product
- Provides program-specific customizations

### **Master Templates (What We Have):**
- Current master templates are good for **Review** and **Submission**
- Need to create **new focused sections for Strategy**

---

## 🎯 **WHAT NEEDS TO CHANGE**

### **1. Restructure MASTER_SECTIONS:**
```typescript
// Current:
MASTER_SECTIONS = {
  grants: [10 sections],  // Full sections
  bankLoans: [8 sections],
  equity: [11 sections],
  visa: [8 sections]
}

// Needed:
MASTER_SECTIONS = {
  grants: {
    strategy: [6 focused sections],    // NEW - create these
    review: [10 full sections],      // USE EXISTING
    submission: [10 full sections]   // USE EXISTING
  },
  bankLoans: {
    strategy: [6 focused sections],   // NEW - create these
    review: [8 full sections],        // USE EXISTING
    submission: [8 full sections]     // USE EXISTING
  },
  // ...
}
```

### **2. Strategy Sections:**
- Create 6 focused sections (Executive Summary, Market Opportunity, Business Model, Competitive Analysis, Financial Overview, **Funding Fit & Eligibility**)
- Word counts: 150-350 words (shorter than current master)
- Purpose: Early-stage strategic thinking

### **3. Review & Submission Sections:**
- Use existing master sections (no changes needed)
- Review: All sections, no program merge
- Submission: All sections + program merge

---

## 💡 **FINAL ANSWER**

**You're correct:**
- Master templates (current) are good for **Review** and **Submission**
- Strategy needs **different, focused sections** (not the current master)

**What to do:**
1. Keep current master sections for **Review** and **Submission**
2. Create new focused sections for **Strategy**
3. Programs only apply to **Submission** (merge program-specific sections)

**Does this make sense now?**

