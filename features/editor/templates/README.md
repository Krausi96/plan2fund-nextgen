# Unified Template System

## How It Works

### Master Templates (Base)
- **Location:** `sections.ts` and `documents.ts`
- **Purpose:** Default templates for all programs
- **Used when:** No program-specific template exists

### Program-Specific Overrides
- **Location:** Database `categorized_requirements` table
- **Purpose:** Customize templates for specific programs
- **Priority:** Overrides master templates

### Hierarchy
```
1. Program-specific template (highest priority)
2. Master template (fallback)
3. Default (grants master)
```

## Usage

```typescript
import { getSections, getDocuments } from '@templates';

// Get sections (master if no program)
const sections = await getSections('grants');

// Get sections with program override
const sections = await getSections('grants', 'program_123');

// Get documents
const docs = await getDocuments('grants', 'submission', 'program_123');
```

## Variable Documents

**Option A: Fixed Structure (Recommended)**
- Each document has one fixed structure
- User fills in content only
- Simpler, more reliable

**Option B: User Picks Structure**
- Document marked `isVariable: true`
- User chooses from structure options
- More flexible, but complex

**Recommendation:** Start with Option A (fixed). Add Option B later if needed.

## Adding New Templates

1. **Master Template:** Add to `sections.ts` or `documents.ts`
2. **Program Override:** Add to database via scraper or admin
3. **Merge automatically:** System handles priority

