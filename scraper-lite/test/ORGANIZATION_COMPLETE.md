# ✅ Test Files Organization - Complete!

## 📁 Final Structure

```
scraper-lite/test/
├── reusable/              # 🔄 Regular analysis & monitoring tools
│   ├── analyze-extracted-data.ts
│   ├── analyze-requirement-values.ts
│   ├── analyze-requirements.ts
│   ├── analyze-discovery.ts
│   ├── show-actual-data.ts
│   ├── monitor-learning.ts
│   ├── speed-test.ts
│   ├── test-reco-integration.ts
│   ├── check-queue.ts
│   └── check-results.ts
│
├── one-time/              # ⚠️ One-time debugging & setup tools
│   ├── full-cycle-test.ts
│   ├── check-openai-usage.ts
│   ├── queue-test-url.ts
│   ├── clean-bad-urls.ts
│   └── clean-failed-jobs.ts
│
├── scripts/               # Script collections
│   ├── manual/
│   └── automatic/
│
├── db-status.ts          # ✅ Keep in root (very common)
├── README.md
└── ORGANIZATION.md
```

---

## 🔄 Reusable Tools (Use Regularly)

### Data Analysis
- ✅ `analyze-extracted-data.ts` - Overall data quality analysis
- ✅ `analyze-requirement-values.ts` - Requirement values analysis
- ✅ `analyze-requirements.ts` - Requirements quality analysis
- ✅ `show-actual-data.ts` - Show sample extracted data

### Discovery Analysis
- ✅ `analyze-discovery.ts` - Discovery quality analysis

### Monitoring
- ✅ `monitor-learning.ts` - Learning system monitoring
- ✅ `speed-test.ts` - Performance testing
- ✅ `check-queue.ts` - Queue status check
- ✅ `check-results.ts` - Results summary

### Integration
- ✅ `test-reco-integration.ts` - Recommendation integration test

**Usage**: Run these regularly to monitor scraper quality and performance.

---

## ⚠️ One-Time Tools (Used for Specific Tasks)

### Testing
- ⚠️ `full-cycle-test.ts` - Full cycle test (slow, use sparingly)

### Setup/Check
- ⚠️ `check-openai-usage.ts` - Check API key (one-time setup)

### Debugging
- ⚠️ `queue-test-url.ts` - Manual URL test (one-time debugging)

### Cleanup
- ⚠️ `clean-bad-urls.ts` - Clean bad URLs (one-time cleanup)
- ⚠️ `clean-failed-jobs.ts` - Clean failed jobs (can reuse if needed)

**Usage**: Run these only when needed for specific debugging or cleanup tasks.

---

## 📋 Package.json Scripts (Updated)

### Reusable Scripts:
```json
"db:status": "tsx scraper-lite/test/db-status.ts"
"test:analyze-discovery": "tsx scraper-lite/test/reusable/analyze-discovery.ts"
"test:analyze-requirements": "tsx scraper-lite/test/reusable/analyze-requirements.ts"
"test:reco-integration": "tsx scraper-lite/test/reusable/test-reco-integration.ts"
"monitor:learning": "tsx scraper-lite/test/reusable/monitor-learning.ts"
"test:speed": "tsx scraper-lite/test/reusable/speed-test.ts"
"analyze:data": "tsx scraper-lite/test/reusable/analyze-extracted-data.ts"
"show:data": "tsx scraper-lite/test/reusable/show-actual-data.ts"
"analyze:values": "tsx scraper-lite/test/reusable/analyze-requirement-values.ts"
```

### One-Time Scripts:
```json
"test:full-cycle": "tsx scraper-lite/test/one-time/full-cycle-test.ts"
"clean:failed": "tsx scraper-lite/test/one-time/clean-failed-jobs.ts"
```

---

## 🎯 Quick Reference

### Daily/Regular Use:
```bash
npm run db:status              # Check database status
npm run analyze:data          # Analyze data quality
npm run show:data             # Show sample data
npm run monitor:learning      # Check learning system
```

### Weekly/Monthly:
```bash
npm run test:analyze-discovery    # Analyze discovery quality
npm run test:analyze-requirements # Analyze requirements quality
npm run test:speed                # Performance test
```

### When Needed:
```bash
npm run clean:failed          # Clean failed jobs
npm run test:full-cycle       # Full cycle test (slow!)
```

---

## ✅ Organization Complete!

**Files Organized**:
- ✅ 10 reusable tools → `reusable/`
- ✅ 5 one-time tools → `one-time/`
- ✅ 1 common tool → root (`db-status.ts`)

**Package.json Updated**: ✅ All script paths updated!

**Status**: ✅ **READY TO USE**

