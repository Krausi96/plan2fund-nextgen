# 📊 Quality Improvements & Storage Recommendations

## Current Extraction Analysis

### ✅ What We Extract (19 Categories)

#### 🎯 CRITICAL Categories (Essential for Matching)
1. **eligibility** - 70% meaningful → Target: 80%+
   - **Usefulness**: ⭐⭐⭐⭐⭐ Essential (WHO can apply)
   - **Issue**: Some generic values ("required", "specified")
   - **Improvement**: Stricter filtering, better context

2. **financial** - 87% meaningful ✅
   - **Usefulness**: ⭐⭐⭐⭐⭐ Essential (HOW MUCH funding)
   - **Status**: Excellent, maintain

3. **documents** - 76% meaningful → Target: 80%+
   - **Usefulness**: ⭐⭐⭐⭐⭐ Actionable (WHAT to submit)
   - **Improvement**: Better list extraction

4. **timeline** - 90% meaningful ✅
   - **Usefulness**: ⭐⭐⭐⭐⭐ Essential (WHEN deadlines)
   - **Status**: Excellent

5. **project** - 97% meaningful ✅
   - **Usefulness**: ⭐⭐⭐⭐ Useful (WHAT the project is)
   - **Status**: Excellent

6. **geographic** - 48% meaningful → Target: 70%+
   - **Usefulness**: ⭐⭐⭐⭐ Important (WHERE applicable)
   - **Issue**: Too many generic locations
   - **Improvement**: Better filtering of placeholders

#### ⚠️ Impact Category Issue (90% but Noise)

**Problem**: Impact shows 90% "meaningful" but examples reveal it's extracting random text:

```
❌ Bad examples:
- "mbH (FFG) is the national funding institution..."
- "and Culture  Space and Aeronautics  Training..."
- "Technologies GmbH..."
```

**Root Cause**: Regex patterns are too broad, capturing:
- Institution descriptions
- General page content
- Program names instead of impact statements

**Fix Needed**:
1. Filter out sentences that:
   - Start with institution names
   - Are < 30 chars (too short)
   - Don't contain impact verbs (reduces, creates, improves, etc.)
   - Contain organization acronyms (FFG, AWS, etc.)

2. Require specific impact keywords IN CONTEXT:
   - "reduces CO2 by X%"
   - "creates X jobs"
   - "improves sustainability"
   - Not just mentions of "sustainability" anywhere

3. Prioritize quantified impact:
   - Keep: "reduces emissions by 50%"
   - Filter: "environmental impact"

## Storage Solution Analysis

### Current: Single JSON File

**Stats**:
- 1,024 pages = 8.01 MB
- ~8 KB per page
- Linear growth: 10K pages = ~80 MB, 100K pages = ~800 MB

**Problems**:
1. ❌ **Full file rewrite** on each update (slow at scale)
2. ❌ **No indexing** (slow queries)
3. ❌ **Not ideal as data source** (loads entire file into memory)
4. ❌ **Risk of data loss** (if write fails mid-operation)
5. ❌ **No concurrent access** (can't query while scraping)

### Recommended: SQLite Database

**Benefits**:
- ✅ **Fast queries** with indexes
- ✅ **Incremental updates** (no full rewrites)
- ✅ **ACID transactions** (data safety)
- ✅ **Good as data source** (can query efficiently)
- ✅ **Export to JSON** when needed
- ✅ **Scales to 100K+ pages** easily
- ✅ **Concurrent reads** while writing

**Performance Comparison**:

| Operation | JSON (10K) | SQLite (10K) |
|-----------|-----------|--------------|
| Load all | ~2-3s | ~50ms |
| Filter by funding | ~3-5s | ~5ms (indexed) |
| Update single page | ~2-3s (rewrite) | ~1ms |
| Query by category | ~3-5s | ~10ms |

## Immediate Improvements

### 1. Fix Impact Extraction (Filter Noise)

**Current Code** (too broad):
```typescript
/(?:impact|wirkung|auswirkung)[\s:]+([^\.\n]{15,250})/gi
```

**Improved** (stricter):
```typescript
// Require impact verbs or quantified impact
/(?:reduces?|creates?|improves?|saves?|increases?|decreases?)[\s]+(?:co2|emissions?|jobs?|energy|waste)[\s:]+([^\.\n]{15,200})/gi
// Filter out: institution names, acronyms, short sentences
```

### 2. Improve Geographic Filtering

**Current**: 48% meaningful - too many "Austria", "Europe" without context

**Improve**:
- Filter locations < 15 chars unless they have context
- Require specific region names, not just country names
- Add context: "Limited to companies in [region]" is better than just "[region]"

### 3. Improve Eligibility to 80%+

**Focus**:
- Filter generic "required" / "specified"
- Extract multiple criteria from lists
- Better heading-based extraction (already implemented, but can improve)

## Implementation Priority

1. **High Priority** (Affects matching quality):
   - Fix impact extraction (filter noise)
   - Improve geographic filtering
   - Improve eligibility to 80%+

2. **Medium Priority** (Storage scalability):
   - Implement SQLite database
   - Migrate existing data
   - Add JSON export for compatibility

3. **Low Priority** (Nice to have):
   - Deprioritize fluff categories (technical, legal, compliance)
   - Improve specialized categories (co_financing, trl_level)


