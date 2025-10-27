# DATA CLEANUP & FIX PROPOSAL

## 🚨 CURRENT PROBLEMS

### **Problem 1: Scraper is Getting Error Pages**
- `scraped-programs-latest.json` (5 programs): "Newsletter", "Not found" pages
- These are **404 error pages**, not real programs
- **Why**: Scraper is hitting `/foerderung` URL which doesn't exist

### **Problem 2: Data Hierarchy is Confused**
**Current Fallback Order:**
1. Database (PostgreSQL via Neon)
2. `scraped-programs-latest.json` (BAD - has error pages)
3. `migrated-programs.json` (GOOD - has 503 real programs)

**Problem:** Step 2 has error pages, Step 3 has real data!

### **Problem 3: Ranking by Importance is Broken**
- QuestionEngine only generates 1 question because most programs are error pages
- Error pages have random eligibility criteria
- Ranking can't calculate importance because data is garbage

---

## ✅ PROPOSED FIXES

### **Fix 1: Delete Bad Data, Use Good Data**

**Files to DELETE:**
- ❌ `data/scraped-programs-latest.json` (error pages)
- ❌ `data/scraped-programs-2025-10-24.json` (error pages)
- ❌ `data/scraped-programs-2025-10-21.json` (likely bad)
- ✅ **Keep**: `data/scraped-programs-2025-10-23.json` (503 real programs!)
- ✅ **Keep**: `data/migrated-programs.json` (fallback)
- ✅ **Keep**: `data/fallback-programs.json` (emergency fallback)
- ✅ **Keep**: `data/scraper-learning.json` (learning data)

### **Fix 2: Update API Fallback Order**

**Current Order (BROKEN):**
```
1. Database → 2. scraped-programs-latest.json (ERROR PAGES) → 3. migrated-programs.json
```

**New Order (FIXED):**
```
1. Database 
2. scraped-programs-2025-10-23.json (503 real programs) 
3. migrated-programs.json (503 fallback programs)
4. fallback-programs.json (emergency)
```

### **Fix 3: Improve Question Ranking**

**Current Problem:**
```javascript
// Only 1 question because most programs are error pages
const importance = 80 + (totalPrograms / this.programs.length) * 20
// Result: 80 + (5 / 5) * 20 = 100 (only location question)
```

**New Solution:**
```javascript
// Use REAL frequency across REAL programs
const importance = baseImportance + (frequencyWeight * frequencyPercent)

// Base importance by category
const BASE_IMPORTANCE = {
  location: 90,        // Always high
  company_age: 85,     // Very important
  revenue: 80,         // Important
  team_size: 75,       // Important
  industry_focus: 70,   // Medium-high
  innovation_level: 65, // Medium
  market_focus: 60      // Medium
}

// Frequency weight (how many programs have this criteria)
const frequencyPercent = (totalPrograms / totalProgramsInCategory) * 100

// Final importance
const importance = BASE_IMPORTANCE[category] + (frequencyWeight * frequencyPercent)
```

### **Fix 4: Question Generation Logic**

**Current Logic (BROKEN):**
```javascript
if (questionCandidates.length < 3) {
  // Add fallback questions
}
// Result: Always uses fallback because real data is error pages
```

**New Logic (FIXED):**
```javascript
// 1. Always generate location question first (highest priority)
questions.push({ question: createLocationQuestion(), importance: 90 })

// 2. Generate from REAL eligibility criteria
const realCriteria = analyzeEligibilityCriteria(programs)
// Only consider programs with valid eligibility_criteria

// 3. Generate questions based on frequency
realCriteria.forEach(criterion => {
  const frequency = calculateFrequency(criterion)
  const importance = BASE_IMPORTANCE[criterion.type] + (frequencyWeight * frequency)
  questions.push({ question: createQuestion(criterion), importance })
})

// 4. Sort by importance and limit to 8-15 questions
questions.sort((a, b) => b.importance - a.importance)
questions = questions.slice(0, 15) // Max 15 questions

// 5. Add fallback questions ONLY if less than 3
if (questions.length < 3) {
  questions.push(...fallbackQuestions)
}
```

### **Fix 5: Filtering Logic**

**Current Filtering (TOO AGGRESSIVE):**
```javascript
const hasMinimalContent = 
  !description || 
  description.length < 20  // TOO STRICT!
```

**New Filtering (RELAXED):**
```javascript
const hasMinimalContent = 
  !description || 
  description.length < 10  // More lenient - keep more programs
```

---

## 🎯 IMPLEMENTATION PLAN

### **Step 1: Clean Up Data**
1. Delete bad JSON files
2. Update API to use good data first
3. Test API endpoint

### **Step 2: Fix Question Ranking**
1. Add BASE_IMPORTANCE constants
2. Calculate frequency from REAL programs only
3. Generate 8-15 questions based on importance
4. Add fallback only if needed

### **Step 3: Test Full Pipeline**
1. Test QuestionEngine with good data
2. Verify 8-15 questions are generated
3. Test SmartWizard flow
4. Verify filtering is working correctly

### **Step 4: Fix Web Scraper (Future)**
1. Fix URL discovery to find real program pages
2. Don't hit `/foerderung` URL
3. Use proper link crawling

---

## 📊 EXPECTED RESULTS

### **Before (CURRENT):**
- 5 error page programs
- 1 question generated
- Filtering too aggressive
- No real eligibility criteria

### **After (PROPOSED):**
- 503 real programs
- 8-15 questions generated
- Filtering lenient but logical
- Real eligibility criteria
- Proper ranking by importance

---

## 🚀 IMMEDIATE ACTIONS

1. **Delete bad JSON files** (scraped-programs-latest.json, scraped-programs-2025-10-24.json)
2. **Update API** to use scraped-programs-2025-10-23.json (503 programs)
3. **Improve QuestionEngine** ranking logic
4. **Relax filtering** to keep more programs
5. **Test** full pipeline with good data

**Result**: 8-15 diverse questions based on real program eligibility criteria!

