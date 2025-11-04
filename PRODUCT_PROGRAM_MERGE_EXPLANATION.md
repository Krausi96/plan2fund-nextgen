# How Product + Program Sections Work Together

---

## 🔍 **CURRENT SYSTEM (How It Works Now)**

### **Current Flow:**
```
1. User selects: fundingType (e.g., "grants")
2. System loads: MASTER_SECTIONS[fundingType] → 10 sections
3. If programId provided:
   - Load program-specific sections from database
   - Merge: program-specific OVERRIDES master by ID
   - Result: Master sections with program-specific customizations
```

### **Example:**
```
User: fundingType="grants", programId="ffg-basisprogramm"

1. MASTER_SECTIONS.grants = [executive_summary, project_description, ...]
2. Database (FFG) = [executive_summary (customized), innovation_technology (customized)]
3. Merge result:
   - executive_summary → Uses FFG version (overridden)
   - project_description → Uses master version (not overridden)
   - innovation_technology → Uses FFG version (overridden)
```

**Current Structure:**
```typescript
MASTER_SECTIONS = {
  grants: [...],      // All sections for grants
  bankLoans: [...],
  equity: [...],
  visa: [...]
}
```

---

## 🎯 **PROPOSED SYSTEM (With Product Types)**

### **Proposed Flow:**
```
1. User selects: fundingType (e.g., "grants") + productType (e.g., "strategy")
2. System loads: MASTER_SECTIONS[fundingType][productType] → 6 sections (for strategy)
3. If programId provided:
   - Load program-specific sections from database
   - Merge: program-specific OVERRIDES master by ID
   - Result: Product-specific master sections with program-specific customizations
```

### **Proposed Structure:**
```typescript
MASTER_SECTIONS = {
  grants: {
    strategy: [...],    // 6 focused sections
    review: [...],      // All sections (10)
    submission: [...]   // All sections + program-specific (10+)
  },
  bankLoans: {
    strategy: [...],
    review: [...],
    submission: [...]
  },
  // ...
}
```

---

## ❓ **THE QUESTION: How Do Programs + Products Work Together?**

### **Scenario 1: Program-Specific Sections Apply to ALL Products**
**Meaning:** Program-specific sections from database override master sections for ALL products (strategy/review/submission).

**Example:**
```
User: fundingType="grants", productType="strategy", programId="ffg-basisprogramm"

1. MASTER_SECTIONS.grants.strategy = [executive_summary, market_opportunity, ...]
2. Database (FFG) = [executive_summary (FFG version)]
3. Merge result:
   - executive_summary → Uses FFG version (overridden)
   - market_opportunity → Uses master version (not in FFG)
```

**Pros:**
- ✅ Simple: Program sections apply universally
- ✅ Consistent: Same program customization across all products

**Cons:**
- ⚠️ Program-specific sections might not be relevant for Strategy (e.g., detailed project description for FFG)
- ⚠️ Strategy might need different sections than what program provides

---

### **Scenario 2: Program-Specific Sections Only Apply to Submission**
**Meaning:** Program-specific sections only override master sections for Submission product. Strategy and Review use master only.

**Example:**
```
User: fundingType="grants", productType="strategy", programId="ffg-basisprogramm"

1. MASTER_SECTIONS.grants.strategy = [executive_summary, market_opportunity, ...]
2. Database (FFG) = [executive_summary (FFG version)]
3. Merge result:
   - Strategy: Uses master only (no program merge)
   - Review: Uses master only (no program merge)
   - Submission: Uses master + program merge
```

**Pros:**
- ✅ Strategy stays focused (no program-specific clutter)
- ✅ Review stays generic (no program-specific requirements)
- ✅ Submission gets full program customization

**Cons:**
- ⚠️ More complex: Different merge logic per product
- ⚠️ Strategy might miss program-specific hints

---

### **Scenario 3: Program-Specific Sections Are Product-Aware**
**Meaning:** Database stores product-specific sections per program. Program has sections for strategy, review, and submission separately.

**Example:**
```
Database (FFG):
- ffg.strategy = [executive_summary (strategy version), ...]
- ffg.review = [executive_summary (review version), ...]
- ffg.submission = [executive_summary (submission version), project_description, ...]

User: fundingType="grants", productType="strategy", programId="ffg-basisprogramm"

1. MASTER_SECTIONS.grants.strategy = [...]
2. Database (FFG).strategy = [...]
3. Merge result: Master + FFG strategy sections
```

**Pros:**
- ✅ Most flexible: Each product gets appropriate program sections
- ✅ Most accurate: Program can provide different sections per product

**Cons:**
- ❌ Requires database schema changes
- ❌ More complex: Need to store product-specific sections in database
- ❌ More data to maintain

---

## ✅ **RECOMMENDATION: Scenario 2 (Program-Specific Only for Submission)**

### **Why:**
1. **Strategy Product:** Should be generic, focused on strategic thinking. Program-specific details (like FFG project description format) are not needed at strategy stage.
2. **Review Product:** Should be generic, focused on quality improvement. Program-specific requirements are less critical during review.
3. **Submission Product:** MUST be program-specific. This is the final application, so it needs exact program requirements.

### **Implementation:**
```typescript
export async function getSections(
  fundingType: string,
  productType: string,  // NEW parameter
  programId?: string,
  baseUrl?: string
): Promise<SectionTemplate[]> {
  // Get product-specific master sections
  const masterSections = MASTER_SECTIONS[fundingType]?.[productType] || [];
  
  // Only merge program-specific sections for submission product
  if (programId && productType === 'submission') {
    const programSections = await loadProgramSections(programId, baseUrl);
    if (programSections.length > 0) {
      return mergeSections(masterSections, programSections);
    }
  }
  
  return masterSections;
}
```

### **Logic:**
- **Strategy + Program:** Uses master strategy sections only (no program merge)
- **Review + Program:** Uses master review sections only (no program merge)
- **Submission + Program:** Uses master submission sections + program-specific merge

---

## 🎯 **ALTERNATIVE: Scenario 1 (Program-Specific Apply to All Products)**

### **If You Want Program Sections to Apply to All Products:**

```typescript
export async function getSections(
  fundingType: string,
  productType: string,
  programId?: string,
  baseUrl?: string
): Promise<SectionTemplate[]> {
  // Get product-specific master sections
  const masterSections = MASTER_SECTIONS[fundingType]?.[productType] || [];
  
  // Merge program-specific sections for ALL products
  if (programId) {
    const programSections = await loadProgramSections(programId, baseUrl);
    if (programSections.length > 0) {
      return mergeSections(masterSections, programSections);
    }
  }
  
  return masterSections;
}
```

### **Logic:**
- **Strategy + Program:** Uses master strategy sections + program-specific merge
- **Review + Program:** Uses master review sections + program-specific merge
- **Submission + Program:** Uses master submission sections + program-specific merge

**Note:** This means program-specific sections (like FFG's detailed project description) might appear in Strategy product, which might be too detailed for a strategic plan.

---

## 📊 **COMPARISON TABLE**

| Scenario | Strategy + Program | Review + Program | Submission + Program |
|----------|-------------------|------------------|---------------------|
| **Scenario 1: All Products** | Master + Program merge | Master + Program merge | Master + Program merge |
| **Scenario 2: Submission Only** | Master only | Master only | Master + Program merge |
| **Scenario 3: Product-Aware** | Master + Program.strategy | Master + Program.review | Master + Program.submission |

---

## ✅ **MY RECOMMENDATION**

**Use Scenario 2: Program-Specific Only for Submission**

**Reasoning:**
1. Strategy should be generic and focused → No program-specific clutter
2. Review should be generic and focused → No program-specific requirements
3. Submission MUST be program-specific → Full program customization needed

**This makes sense because:**
- Strategy is early-stage planning → Doesn't need program-specific format yet
- Review is quality improvement → Doesn't need program-specific requirements yet
- Submission is final application → MUST match program requirements exactly

---

## 🤔 **YOUR QUESTION: "Are we sure about that?"**

**Answer:** It depends on your use case:

1. **If programs provide sections that are useful for Strategy/Review:** Use Scenario 1 (merge for all products)
2. **If programs provide sections only relevant for Submission:** Use Scenario 2 (merge only for submission)
3. **If you want maximum flexibility:** Use Scenario 3 (product-aware database)

**Most likely:** Scenario 2 makes the most sense because:
- Strategy = generic strategic thinking
- Review = generic quality improvement
- Submission = program-specific application

**What do you think?** Which scenario makes sense for your use case?

