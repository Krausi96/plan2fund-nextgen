# Test Files Organization

## 📁 Folder Structure

### `reusable/` - Regular Analysis & Monitoring Tools
These are tools you'll use regularly to monitor and analyze the scraper:

- `analyze-extracted-data.ts` - Overall data quality analysis
- `analyze-requirement-values.ts` - Requirement values analysis
- `analyze-requirements.ts` - Requirements quality analysis
- `analyze-discovery.ts` - Discovery quality analysis
- `show-actual-data.ts` - Show sample extracted data
- `db-status.ts` - Database status check
- `check-queue.ts` - Queue status check
- `check-results.ts` - Results summary
- `monitor-learning.ts` - Learning system monitoring
- `speed-test.ts` - Performance testing
- `test-reco-integration.ts` - Recommendation integration test

### `one-time/` - One-Time Debugging & Setup
These were used for specific debugging or setup tasks:

- `full-cycle-test.ts` - Full cycle test (can be reused but slow)
- `check-openai-usage.ts` - Check OpenAI API key (one-time setup)
- `queue-test-url.ts` - Manual URL queue test (debugging)
- `clean-bad-urls.ts` - Clean bad URLs (one-time cleanup)
- `clean-failed-jobs.ts` - Clean failed jobs (one-time cleanup)
- `debug-queue.ts` - Debug queue issues (one-time debugging)
- `check-queue-join.ts` - Debug SQL join (one-time debugging)

### `scripts/` - Script Collections
- `manual/` - Manual scripts
- `automatic/` - Automatic scripts (empty)

---

## 🔄 Reusable Tools (Use Regularly)

### Data Analysis
- `analyze-extracted-data.ts` - Overall quality
- `analyze-requirement-values.ts` - Requirement values
- `analyze-requirements.ts` - Requirements quality
- `show-actual-data.ts` - Sample data

### Discovery Analysis
- `analyze-discovery.ts` - Discovery quality

### Monitoring
- `db-status.ts` - Database status
- `check-queue.ts` - Queue status
- `monitor-learning.ts` - Learning system
- `speed-test.ts` - Performance

### Integration
- `test-reco-integration.ts` - Reco integration

---

## ⚠️ One-Time Tools (Used for Specific Tasks)

### Setup/Check
- `check-openai-usage.ts` - Check API key (one-time)

### Debugging
- `debug-queue.ts` - Debug queue (one-time)
- `check-queue-join.ts` - Debug SQL (one-time)
- `queue-test-url.ts` - Manual test (one-time)

### Cleanup
- `clean-bad-urls.ts` - Clean bad URLs (one-time)
- `clean-failed-jobs.ts` - Clean failed jobs (one-time)

### Testing
- `full-cycle-test.ts` - Full cycle (slow, use sparingly)

---

## 📋 Package.json Scripts

### Reusable (Keep):
- `db:status` - Database status
- `test:analyze-discovery` - Discovery analysis
- `test:analyze-requirements` - Requirements analysis
- `test:reco-integration` - Reco integration
- `monitor:learning` - Learning monitoring
- `test:speed` - Speed test
- `analyze:data` - Data analysis
- `show:data` - Show data
- `analyze:values` - Values analysis
- `clean:failed` - Clean failed jobs (can be reused)

### One-Time (Can Remove):
- `test:full-cycle` - Full cycle test (slow, use sparingly)
- (No scripts for debug files - they were one-time)

---

## 🎯 Recommendations

### Keep in Root (Frequently Used):
- `db-status.ts` - Very common
- `check-queue.ts` - Common
- `analyze-extracted-data.ts` - Common

### Move to `reusable/`:
- All analysis tools
- Monitoring tools
- Integration tests

### Move to `one-time/`:
- Debug scripts
- Cleanup scripts
- Setup scripts

---

## ✅ Action Plan

1. Create `reusable/` and `one-time/` folders
2. Move files accordingly
3. Update package.json script paths
4. Update imports if needed

