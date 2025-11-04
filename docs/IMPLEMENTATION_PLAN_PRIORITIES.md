# Implementation Plan: High-Priority Fixes

## Overview

This document outlines the logical implementation approach for the three high-priority issues:
1. Fix Filtering Logic
2. Improve Scoring Algorithm  
3. Fix Database Connection

---

## Priority 1: Fix Filtering Logic

### Problem Analysis
- Only location filtering works effectively (4.4%-79.2% filtered)
- Other filters (company_age, revenue, team_size) filter 0% because:
  - Filters return `true` by default if no requirement exists (fair, but appears ineffective)
  - Many programs don't have these requirements, so they all pass
  - Missing filter handlers for newer question types

### Implementation Steps

#### Step 1.1: Add Missing Filter Handlers
**File:** `features/reco/engine/questionEngine.ts`

**Action:** Add filter handlers for all question types in `filterPrograms()` method

```typescript
// Add to filterPrograms() method (around line 923):
if (answers.innovation_focus === 'no') {
  filtered = filtered.filter(program => !this.requiresInnovation(program));
}

if (answers.sustainability_focus === 'no') {
  filtered = filtered.filter(program => !this.requiresSustainability(program));
}

if (answers.industry_focus) {
  filtered = filtered.filter(program => this.matchesIndustry(program, answers.industry_focus));
}

if (answers.technology_focus) {
  filtered = filtered.filter(program => this.matchesTechnology(program, answers.technology_focus));
}

if (answers.company_type) {
  filtered = filtered.filter(program => this.matchesCompanyType(program, answers.company_type));
}

if (answers.sector) {
  filtered = filtered.filter(program => this.matchesSector(program, answers.sector));
}

if (answers.impact_focus === 'no') {
  filtered = filtered.filter(program => !this.requiresImpact(program));
}

if (answers.market_size) {
  filtered = filtered.filter(program => this.matchesMarketSize(program, answers.market_size));
}

if (answers.investment_type) {
  filtered = filtered.filter(program => this.matchesInvestmentType(program, answers.investment_type));
}
```

**Note:** Most of these filter functions already exist (lines 1082-1191), they just need to be called.

#### Step 1.2: Add Filtering Logging
**File:** `features/reco/engine/questionEngine.ts`

**Action:** Add logging to understand filtering effectiveness

```typescript
// In filterPrograms() method, add logging:
if (answers.location) {
  const before = filtered.length;
  filtered = filtered.filter(program => this.matchesLocation(program, answers.location));
  const after = filtered.length;
  console.log(`🔍 Location filter (${answers.location}): ${before} → ${after} (${before - after} filtered)`);
}

// Repeat for all filters...
```

#### Step 1.3: Improve Filter Visibility
**File:** `features/reco/components/wizard/SmartWizard.tsx`

**Action:** Show filtering feedback to users

```typescript
// In handleAnswer(), after filtering:
const beforeCount = questionEngine.getRemainingProgramCount();
// ... filter ...
const afterCount = questionEngine.getRemainingProgramCount();
const filteredCount = beforeCount - afterCount;

// Show in UI:
setState(prev => ({
  ...prev,
  remainingProgramCount: afterCount,
  filteringFeedback: {
    question: state.currentQuestion?.id,
    before: beforeCount,
    after: afterCount,
    filtered: filteredCount
  }
}));
```

**Testing:**
- Run `node scripts/test-reco-direct.js` after changes
- Verify filtering percentages improve
- Check logs show filtering activity

---

## Priority 2: Improve Scoring Algorithm

### Problem Analysis
- All programs getting 100% scores (unrealistic)
- Scoring too generous:
  - Line 469: `10 * confidence` points per match (can be 10 points for confidence=1.0)
  - Line 930-931: Up to 20 bonus points if matchedCriteria.length > 0
  - No penalties for missing requirements
  - No normalization relative to total possible requirements

### Implementation Steps

#### Step 2.1: Normalize Scoring Base
**File:** `features/reco/engine/enhancedRecoEngine.ts`

**Action:** Change scoring to be percentage-based instead of additive

**Current (line 469):**
```typescript
const categoryScore = Math.round(10 * confidence); // 10 points per match
score += categoryScore;
```

**New Approach:**
```typescript
// Calculate total possible score based on requirements
const totalPossibleRequirements = Object.values(categorizedRequirements)
  .flat()
  .filter((item: any) => item.confidence > 0.7) // Only high-confidence requirements count
  .length;

// Score per match (percentage of total)
const pointsPerRequirement = totalPossibleRequirements > 0 
  ? 100 / totalPossibleRequirements  // Distribute 100 points across all requirements
  : 0;

if (matched) {
  const categoryScore = Math.round(pointsPerRequirement * confidence);
  score += categoryScore;
} else if (confidence > 0.7) {
  // Penalty for missing high-confidence requirements
  const penalty = Math.round(pointsPerRequirement * 0.3); // 30% penalty
  score = Math.max(0, score - penalty);
}
```

#### Step 2.2: Add Penalties for Missing Requirements
**File:** `features/reco/engine/enhancedRecoEngine.ts`

**Action:** Add penalties in the main scoring loop (around line 905-914)

```typescript
// After scoring categorized requirements:
if (program.categorized_requirements) {
  const categorizedScore = scoreCategorizedRequirements(program.categorized_requirements, answers);
  score += categorizedScore.score;
  matchedCriteria.push(...categorizedScore.matchedCriteria);
  gaps.push(...categorizedScore.gaps);
  
  // NEW: Penalty for missing high-priority requirements
  const highPriorityGaps = categorizedScore.gaps.filter(g => g.priority === 'high');
  if (highPriorityGaps.length > 0) {
    score -= highPriorityGaps.length * 15; // -15 points per high-priority gap
  }
  
  // NEW: Penalty for many unmatched requirements
  const unmatchedRequirements = categorizedScore.gaps.length;
  if (unmatchedRequirements > 3) {
    score -= (unmatchedRequirements - 3) * 5; // -5 points per additional gap
  }
}
```

#### Step 2.3: Remove Excessive Bonus Points
**File:** `features/reco/engine/enhancedRecoEngine.ts`

**Action:** Reduce or remove bonus points (line 930-931)

**Current:**
```typescript
if (matchedCriteria.length > 0) {
  scorePercent += Math.min(20, matchedCriteria.length * 5); // Up to 20 bonus points
}
```

**New:**
```typescript
// Only add small bonus for perfect matches (all requirements met)
if (gaps.length === 0 && matchedCriteria.length >= 3) {
  scorePercent += 5; // Small bonus for perfect match
}

// Cap at 100%
scorePercent = Math.min(100, scorePercent);
```

#### Step 2.4: Normalize Final Score
**File:** `features/reco/engine/enhancedRecoEngine.ts`

**Action:** Ensure score is always between 0-100 and properly distributed

```typescript
// After all scoring calculations (around line 932):
// Normalize score to 0-100 range
scorePercent = Math.max(0, Math.min(100, scorePercent));

// If score is 0, check if it's because:
// 1. No requirements at all (should be 50% - neutral)
// 2. All requirements failed (should be 0% - correct)
const hasRequirements = Object.keys(program.categorized_requirements || {}).length > 0 ||
                        Object.keys(program.requirements || {}).length > 0;

if (scorePercent === 0 && !hasRequirements) {
  scorePercent = 50; // Neutral score for programs with no requirements
}
```

**Testing:**
- Run scoring tests with various answer combinations
- Verify score distribution (should be 0-100%, not all 100%)
- Check that programs with missing requirements get lower scores

---

## Priority 3: Fix Database Connection

### Problem Analysis
- Database connection failing, falling back to JSON
- Error: "Database load failed, trying JSON fallback..."
- Need to verify credentials and connection

### Implementation Steps

#### Step 3.1: Check Database Configuration
**File:** Check environment variables and database config

**Action:** Verify database connection string exists

```bash
# Check if DATABASE_URL is set
echo $DATABASE_URL  # Linux/Mac
echo $env:DATABASE_URL  # PowerShell
```

**Files to check:**
- `.env.local` or `.env`
- `scraper-lite/src/db/neon-client.ts`
- Any database configuration files

#### Step 3.2: Add Better Error Handling
**File:** `pages/api/programs.ts` (around line 269-472)

**Action:** Add detailed error logging for database failures

```typescript
// Around line 270, in the database try block:
try {
  const { searchPages, getAllPages } = require('../../scraper-lite/src/db/page-repository');
  
  const pages = type 
    ? await searchPages({ region: type, limit: 1000 })
    : await getAllPages(1000);
  
  if (pages.length === 0) {
    console.warn('⚠️ No pages found in database, using JSON fallback');
    throw new Error('No pages in database');
  }
  
  // ... rest of database logic ...
} catch (dbError) {
  console.error('❌ Database connection failed:', {
    message: dbError instanceof Error ? dbError.message : String(dbError),
    stack: dbError instanceof Error ? dbError.stack : undefined,
    // Add connection details (without sensitive info)
    hasDatabaseUrl: !!process.env.DATABASE_URL,
    databaseUrlLength: process.env.DATABASE_URL?.length || 0
  });
  
  // Check if it's a connection error vs query error
  if (dbError instanceof Error) {
    if (dbError.message.includes('connection') || dbError.message.includes('ECONNREFUSED')) {
      console.error('❌ Database connection refused - check DATABASE_URL and network');
    } else if (dbError.message.includes('authentication') || dbError.message.includes('password')) {
      console.error('❌ Database authentication failed - check credentials');
    } else if (dbError.message.includes('timeout')) {
      console.error('❌ Database connection timeout - check network/firewall');
    }
  }
  
  throw dbError; // Re-throw to trigger fallback
}
```

#### Step 3.3: Add Connection Health Check
**File:** `scraper-lite/src/db/neon-client.ts` (or create new file)

**Action:** Add connection health check function

```typescript
export async function checkDatabaseConnection(): Promise<{
  connected: boolean;
  error?: string;
  details?: any;
}> {
  try {
    const pool = getPool();
    const result = await pool.query('SELECT 1 as health');
    return {
      connected: true,
      details: {
        queryTime: Date.now(),
        poolSize: pool.totalCount
      }
    };
  } catch (error) {
    return {
      connected: false,
      error: error instanceof Error ? error.message : String(error)
    };
  }
}
```

#### Step 3.4: Test Database Connection
**Action:** Create test script

**File:** `scripts/test-database-connection.js`

```javascript
const { checkDatabaseConnection } = require('../scraper-lite/src/db/neon-client');

async function testConnection() {
  console.log('🔍 Testing database connection...');
  const result = await checkDatabaseConnection();
  
  if (result.connected) {
    console.log('✅ Database connected successfully');
    console.log('Details:', result.details);
  } else {
    console.error('❌ Database connection failed:', result.error);
    console.log('\nTroubleshooting:');
    console.log('1. Check DATABASE_URL environment variable');
    console.log('2. Verify database credentials');
    console.log('3. Check network/firewall settings');
    console.log('4. Verify database is running');
  }
}

testConnection().catch(console.error);
```

**Run:**
```bash
node scripts/test-database-connection.js
```

**Testing:**
- Run connection test script
- Check error messages for specific issues
- Verify DATABASE_URL is set correctly
- Test with corrected credentials

---

## Implementation Order

### Phase 1: Quick Wins (1-2 hours)
1. ✅ Add missing filter handlers (Step 1.1)
2. ✅ Add filtering logging (Step 1.2)
3. ✅ Test filtering improvements

### Phase 2: Scoring Fix (2-3 hours)
1. ✅ Normalize scoring base (Step 2.1)
2. ✅ Add penalties (Step 2.2)
3. ✅ Remove excessive bonuses (Step 2.3)
4. ✅ Normalize final score (Step 2.4)
5. ✅ Test scoring distribution

### Phase 3: Database Fix (1-2 hours)
1. ✅ Check database config (Step 3.1)
2. ✅ Add error handling (Step 3.2)
3. ✅ Add health check (Step 3.3)
4. ✅ Test connection (Step 3.4)

### Total Estimated Time: 4-7 hours

---

## Testing Strategy

### After Each Phase

**Filtering Tests:**
```bash
node scripts/test-reco-direct.js
# Expected: Filtering percentages should improve
# Expected: Logs show filtering activity for all question types
```

**Scoring Tests:**
```bash
node scripts/test-reco-direct.js
# Expected: Score distribution 0-100%, not all 100%
# Expected: Programs with missing requirements have lower scores
```

**Database Tests:**
```bash
node scripts/test-database-connection.js
# Expected: Connection successful or clear error message
```

### Integration Tests

After all phases complete:
1. Run full wizard flow
2. Verify filtering works for all questions
3. Verify scoring is realistic (variety of scores)
4. Verify database connection works (or clear fallback)

---

## Success Criteria

### Filtering
- ✅ All question types have filter handlers
- ✅ Filtering percentages > 0% for most questions
- ✅ Logs show filtering activity
- ✅ Users see filtering feedback

### Scoring
- ✅ Score distribution: 0-100% (not all 100%)
- ✅ Programs with missing requirements score lower
- ✅ Penalties applied correctly
- ✅ Scores are realistic and meaningful

### Database
- ✅ Connection works OR clear error message
- ✅ Fallback to JSON works gracefully
- ✅ Error messages are helpful for debugging

---

## Rollback Plan

If issues occur:
1. **Filtering:** Revert filter handlers, keep original logic
2. **Scoring:** Revert to additive scoring, keep bonus points
3. **Database:** Keep JSON fallback, improve error messages only

---

## Next Steps

1. **Start with Phase 1** (filtering) - easiest and most visible impact
2. **Then Phase 2** (scoring) - most important for user experience
3. **Finally Phase 3** (database) - infrastructure issue

Would you like me to start implementing these changes?

