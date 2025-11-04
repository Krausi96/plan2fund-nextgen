# Automatic Learning and Feedback System

## ✅ What Was Implemented

### 1. **Database Tables for Learning**
- `extraction_patterns` table: Stores patterns with confidence scores
- `extraction_metrics` table: Tracks extraction success per field per page

### 2. **Automatic Pattern Tracking**
- Every time a pattern successfully extracts data, it's recorded
- Confidence scores adjust automatically based on success rate
- Patterns with >80% success rate get higher confidence
- Patterns with <50% success rate get lower confidence

### 3. **Feedback Loop Integration**
- Integrated into `extract.ts` - automatically tracks pattern usage
- Integrated into `scraper.ts` - tracks extraction outcomes per page
- Learning happens **during scraping**, not after

## 🔄 How It Works

### During Extraction:
1. Pattern matches → Extract data
2. Record pattern usage → Track success/failure
3. Adjust confidence → Increase/decrease based on outcome

### Next Scrape:
1. Load high-confidence patterns first
2. Use patterns sorted by confidence (best first)
3. Continue learning from new scrapes
4. Patterns automatically improve over time

## 📊 Pattern Learning

### Confidence Scoring:
- **High (>80% success)**: Confidence increases (+0.05)
- **Medium (50-80% success)**: Confidence stays stable (0.3-0.8)
- **Low (<50% success)**: Confidence decreases (-0.05)

### Automatic Adjustment:
- After 5+ uses, confidence adjusts automatically
- Patterns with high confidence are used first
- Low-confidence patterns are deprioritized

## 🚀 Usage

### Automatic (Already Active):
- Learning happens automatically during scraping
- No manual intervention needed
- Patterns improve with each scrape

### Check Learning Status:
```bash
# View pattern confidence scores
node scripts/manual/check-pattern-learning.js
```

### Manual Pattern Learning:
```bash
# Learn patterns from existing scraped data
node scripts/automatic/learn-patterns-from-scraped.js
```

## 📈 Expected Results

### Timeline Patterns:
- Best patterns rise to top (>80% success)
- Poor patterns get deprioritized (<50% success)
- Coverage should improve from 51.1% to 55-60%+

### TRL Patterns:
- Successful TRL patterns get higher confidence
- Coverage should improve from 0.7% to 2-3%+

### Market Size Patterns:
- Successful patterns get prioritized
- Coverage should improve from 2.1% to 3-5%+

## 🔍 How to Verify

After running scrapes, check:
```sql
-- View pattern confidence scores
SELECT pattern_type, pattern_text, confidence, success_rate, usage_count
FROM extraction_patterns
ORDER BY confidence DESC, success_rate DESC
LIMIT 20;

-- View extraction success rates by field
SELECT field_name, 
       COUNT(*) FILTER (WHERE extracted = true) as success_count,
       COUNT(*) as total_count,
       ROUND(100.0 * COUNT(*) FILTER (WHERE extracted = true) / COUNT(*), 1) as success_rate
FROM extraction_metrics
GROUP BY field_name
ORDER BY success_rate DESC;
```

## 💡 Key Benefits

1. **Automatic Improvement**: Patterns get better with each scrape
2. **Self-Adjusting**: No manual pattern updates needed
3. **Host-Specific**: Learns patterns that work best per site
4. **Data-Driven**: Adjusts based on actual success rates
5. **Non-Breaking**: Learning failures don't break scraping

## 🎯 Next Steps

1. **Run scrapes** - Learning happens automatically
2. **Check results** - Patterns improve over time
3. **Monitor confidence** - See which patterns work best

The system is now **self-learning** - patterns will automatically adjust on the next scrape based on what worked before!

