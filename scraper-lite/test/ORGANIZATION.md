# Test Files Organization

## 📁 Structure

```
scraper-lite/test/
├── reusable/          # Regular analysis & monitoring tools
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
├── one-time/          # One-time debugging & setup tools
│   ├── full-cycle-test.ts
│   ├── check-openai-usage.ts
│   ├── queue-test-url.ts
│   ├── clean-bad-urls.ts
│   ├── clean-failed-jobs.ts
│   ├── debug-queue.ts (if exists)
│   └── check-queue-join.ts (if exists)
│
├── scripts/           # Script collections
│   ├── manual/
│   └── automatic/
│
├── db-status.ts      # Keep in root (very common)
└── README.md
```

---

## 🔄 Reusable Tools (Use Regularly)

### Data Analysis
- ✅ `analyze-extracted-data.ts` - Overall data quality
- ✅ `analyze-requirement-values.ts` - Requirement values
- ✅ `analyze-requirements.ts` - Requirements quality
- ✅ `show-actual-data.ts` - Sample extracted data

### Discovery Analysis
- ✅ `analyze-discovery.ts` - Discovery quality

### Monitoring
- ✅ `monitor-learning.ts` - Learning system status
- ✅ `speed-test.ts` - Performance metrics
- ✅ `check-queue.ts` - Queue status
- ✅ `check-results.ts` - Results summary

### Integration
- ✅ `test-reco-integration.ts` - Recommendation integration

**Usage**: Run these regularly to monitor scraper quality and performance.

---

## ⚠️ One-Time Tools (Used for Specific Tasks)

### Testing
- ⚠️ `full-cycle-test.ts` - Full cycle test (slow, use sparingly)

### Setup/Check
- ⚠️ `check-openai-usage.ts` - Check API key (one-time setup)

### Debugging
- ⚠️ `debug-queue.ts` - Debug queue issues (one-time)
- ⚠️ `check-queue-join.ts` - Debug SQL join (one-time)
- ⚠️ `queue-test-url.ts` - Manual URL test (one-time)

### Cleanup
- ⚠️ `clean-bad-urls.ts` - Clean bad URLs (one-time)
- ⚠️ `clean-failed-jobs.ts` - Clean failed jobs (can reuse if needed)

**Usage**: Run these only when needed for specific debugging or cleanup tasks.

---

## 📋 Package.json Scripts

### Reusable Scripts (Keep):
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

### One-Time Scripts (Optional):
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

All test files are now organized into:
- ✅ `reusable/` - Regular tools
- ✅ `one-time/` - Debugging/cleanup tools
- ✅ `db-status.ts` - Kept in root (very common)

**Package.json scripts updated!** 🎯

