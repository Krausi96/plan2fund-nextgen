# Priority 2: Scoring Algorithm Analysis

## Current Scoring System Analysis

### How Scoring Works in enhancedRecoEngine

**Location:** `features/reco/engine/enhancedRecoEngine.ts` → `scoreCategorizedRequirements()`

**Current Algorithm (Line 469):**
```typescript
const categoryScore = Math.round(10 * confidence); // Base 10 points per match
score += categoryScore;
```

**Problems:**
1. **Fixed scoring:** 10 points per match (not dynamic)
2. **No normalization:** Doesn't account for total possible requirements
3. **No penalties:** Missing requirements don't reduce score
4. **Excessive bonuses:** Up to 20 bonus points (line 931)
5. **All programs get 100%:** Because scoring is too generous

### Is Scoring Dynamic?

**Answer: NO** ❌

- **QuestionEngine:** ✅ Dynamic (generates questions based on requirement frequencies)
- **Scoring:** ❌ Static (fixed 10 points per match, regardless of frequency)

**What happens if answer frequencies change?**
- **QuestionEngine:** Adapts (generates different questions based on new frequencies)
- **Scoring:** Does NOT adapt (still uses same fixed scoring algorithm)

**Example:**
- If 100 programs require location, 10 require TRL → Questions adapt
- But scoring still gives 10 points for location match, 10 points for TRL match
- No weighting based on how common/rare a requirement is

### Relationship to enhancedRecoEngine

**Scoring Flow:**
1. `scoreProgramsEnhanced()` receives programs (pre-filtered or fetched)
2. For each program, calls `scoreCategorizedRequirements()`
3. `scoreCategorizedRequirements()` matches user answers to program requirements
4. Gives 10 points per match (weighted by confidence)
5. Adds bonus points (up to 20)
6. Returns final score (often 100% for all programs)

**Key Issue:**
- Scoring is **static** (not frequency-based)
- Should be **dynamic** (weight requirements by how common/rare they are)

---

## Data Source Analysis

### Where Does Data Come From?

**Primary Source:** Database (NEON PostgreSQL)
- **Table:** `pages` (program information)
- **Table:** `requirements` (categorized requirements - 18 categories)
- **Query:** `SELECT category, type, value, required, source, description, format, requirements FROM requirements WHERE page_id = $1`

**Fallback Source:** JSON files
- `scraper-lite/data/legacy/scraped-programs-latest.json`
- `data/migrated-programs.json`

**Data Flow:**
```
Database (NEON)
  ↓
pages table → Program metadata
  ↓
requirements table → categorized_requirements (18 categories)
  ↓
API endpoint (/api/programs)
  ↓
QuestionEngine (for filtering)
  ↓
enhancedRecoEngine (for scoring)
```

### Does It Have All The Data?

**Potential Issues:**

1. **Requirements Query:** Only loads requirements for specific page_id
   - ✅ Should have all requirements per program
   - ⚠️ Need to verify all programs have requirements loaded

2. **Missing Categories:** Some programs might not have all 18 categories
   - ✅ This is expected (not all programs have all requirement types)
   - ✅ Filtering handles this (returns true if no requirement)

3. **Data Completeness:** 
   - ⚠️ Database connection failing (falling back to JSON)
   - ⚠️ JSON might be outdated
   - ⚠️ Need to verify all requirements are in database

### What Data Is Missing?

**Check Needed:**
1. Are all programs in database?
2. Do all programs have requirements in `requirements` table?
3. Are all 18 categories represented?
4. Is confidence scoring populated?

---

## Proposed Improvements

### 1. Make Scoring Dynamic (Frequency-Based)

**Current:** Fixed 10 points per match
**New:** Weight by requirement frequency

```typescript
// Calculate requirement frequency (how common is this requirement)
const requirementFrequency = calculateRequirementFrequency(category, type, allPrograms);

// Score based on frequency (rare requirements worth more)
const baseScore = requirementFrequency < 0.1 ? 15 :  // Rare (<10%): 15 points
                  requirementFrequency < 0.5 ? 10 :  // Common (<50%): 10 points
                  5;                                 // Very common (>50%): 5 points

const categoryScore = Math.round(baseScore * confidence);
```

### 2. Normalize Scoring (Percentage-Based)

**Current:** Additive scoring (can exceed 100%)
**New:** Percentage-based (0-100%)

```typescript
// Calculate total possible score
const totalPossibleRequirements = countHighConfidenceRequirements(categorizedRequirements);

// Score as percentage
const pointsPerRequirement = totalPossibleRequirements > 0 
  ? 100 / totalPossibleRequirements 
  : 0;

const categoryScore = matched ? 
  Math.round(pointsPerRequirement * confidence) : 
  -Math.round(pointsPerRequirement * 0.3); // Penalty for missing
```

### 3. Add Penalties for Missing Requirements

**Current:** No penalties
**New:** Penalties for missing high-confidence requirements

```typescript
if (!matched && confidence > 0.7) {
  const penalty = Math.round(pointsPerRequirement * 0.3); // 30% penalty
  score = Math.max(0, score - penalty);
}
```

### 4. Remove Excessive Bonuses

**Current:** Up to 20 bonus points
**New:** Small bonus only for perfect matches

```typescript
// Only bonus for perfect matches (all requirements met)
if (gaps.length === 0 && matchedCriteria.length >= 3) {
  scorePercent += 5; // Small bonus
}
```

---

## Implementation Plan

### Step 1: Analyze Data Completeness
- Verify all programs have requirements
- Check requirement frequency distribution
- Identify missing data

### Step 2: Make Scoring Dynamic
- Calculate requirement frequencies
- Weight scoring by frequency
- Rare requirements worth more

### Step 3: Normalize Scoring
- Change to percentage-based
- Distribute 100 points across all requirements
- Add penalties

### Step 4: Remove Bonuses
- Reduce bonus from 20 to 5 points
- Only for perfect matches

### Step 5: Test
- Verify score distribution (0-100%, not all 100%)
- Test with various answer combinations
- Verify penalties work

---

## Questions to Answer

1. ✅ **How is scoring related to enhancedRecoEngine?**
   - Scoring is done entirely in `enhancedRecoEngine.scoreCategorizedRequirements()`
   - It's the ONLY scoring system (unified)

2. ✅ **Is scoring dynamic based on answer frequencies?**
   - **NO** - Scoring is static (fixed 10 points per match)
   - QuestionEngine IS dynamic (adapts to frequencies)
   - Scoring does NOT adapt

3. ✅ **Where does data come from?**
   - Primary: Database (pages + requirements tables)
   - Fallback: JSON files
   - Need to verify all data is present

4. ⚠️ **Does it have all the data?**
   - Need to verify: Are all programs in database?
   - Need to verify: Do all programs have requirements?
   - Need to verify: Are all 18 categories represented?

---

## Next Steps

1. **Verify data completeness** (check database/JSON)
2. **Implement dynamic scoring** (frequency-based weighting)
3. **Normalize scoring** (percentage-based)
4. **Add penalties** (for missing requirements)
5. **Test** (verify score distribution)

