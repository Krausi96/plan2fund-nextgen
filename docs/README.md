# Plan2Fund Documentation

## Quick Links

- **[FINAL_SUMMARY.md](./FINAL_SUMMARY.md)** - Current pipeline status (⭐ START HERE)
- **[HOW_THE_LOGIC_WORKS.md](./HOW_THE_LOGIC_WORKS.md)** - How the dynamic vs static logic works
- **[DEVELOPMENT_GUIDE.md](./DEVELOPMENT_GUIDE.md)** - Developer reference
- **[EDITOR_CLEANUP_HANDOVER.md](./EDITOR_CLEANUP_HANDOVER.md)** - Editor system documentation

## System Architecture

The pipeline uses a **unified, dynamic approach**:

1. **Web Scraper** → Scrapes 503 programs with eligibility_criteria
2. **Question Engine** → Progressively filters programs based on user answers
3. **Scoring Engine** → Scores pre-filtered programs (no duplicate filtering!)
4. **Results Display** → Shows ranked programs to user

### Key Features

- ✅ **Dynamic question generation** from program data
- ✅ **Progressive filtering** as user answers
- ✅ **Single source of truth** (no duplicate filtering)
- ✅ **Automatic navigation** to results page
- ✅ **Works with both wizard and advanced search**

For detailed architecture, see [ARCHITECTURE_ASSESSMENT.md](./ARCHITECTURE_ASSESSMENT.md)
