# Test Files Organization - Summary

## ✅ Organization Complete!

### 📁 Structure

```
scraper-lite/test/
├── reusable/              # 🔄 9 files - Regular analysis tools
│   ├── analyze-extracted-data.ts
│   ├── analyze-requirement-values.ts
│   ├── analyze-requirements.ts
│   ├── analyze-discovery.ts
│   ├── show-actual-data.ts
│   ├── monitor-learning.ts
│   ├── speed-test.ts
│   ├── check-queue.ts
│   └── check-results.ts
│
├── one-time/              # ⚠️ 5 files - Debugging & cleanup
│   ├── full-cycle-test.ts
│   ├── check-openai-usage.ts
│   ├── queue-test-url.ts
│   ├── clean-bad-urls.ts
│   └── clean-failed-jobs.ts
│
├── scripts/               # Script collections
│   └── manual/
│
└── db-status.ts          # ✅ Root - Very common tool
```

---

## 🔄 Reusable Tools (9 files)

**Use regularly** to monitor and analyze scraper performance:

1. **Data Analysis**:
   - `analyze-extracted-data.ts` - Overall quality
   - `analyze-requirement-values.ts` - Requirement values
   - `analyze-requirements.ts` - Requirements quality
   - `show-actual-data.ts` - Sample data

2. **Discovery Analysis**:
   - `analyze-discovery.ts` - Discovery quality

3. **Monitoring**:
   - `monitor-learning.ts` - Learning system
   - `speed-test.ts` - Performance
   - `check-queue.ts` - Queue status
   - `check-results.ts` - Results summary

**Scripts**: All updated in `package.json` ✅

---

## ⚠️ One-Time Tools (5 files)

**Use only when needed** for specific tasks:

1. **Testing**:
   - `full-cycle-test.ts` - Full cycle (slow, use sparingly)

2. **Setup**:
   - `check-openai-usage.ts` - Check API key

3. **Debugging**:
   - `queue-test-url.ts` - Manual URL test

4. **Cleanup**:
   - `clean-bad-urls.ts` - Clean bad URLs
   - `clean-failed-jobs.ts` - Clean failed jobs

**Scripts**: Updated in `package.json` ✅

---

## 📋 Quick Commands

### Regular Use:
```bash
npm run db:status              # Database status
npm run analyze:data          # Data quality
npm run show:data             # Sample data
npm run monitor:learning      # Learning status
```

### When Needed:
```bash
npm run clean:failed          # Clean failed jobs
npm run test:full-cycle       # Full cycle (slow!)
```

---

## ✅ All Fixed!

- ✅ Files organized into folders
- ✅ Import paths fixed (../db → ../../db)
- ✅ Package.json scripts updated
- ✅ Ready to use!

**Organization complete!** 🎯

