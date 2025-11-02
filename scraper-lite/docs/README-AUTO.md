# 🤖 Fully Automated Self-Running Scraper

The scraper can now run fully automatically with self-improvement capabilities!

## Quick Start

```bash
# Run fully automated cycle (recommended)
node run-lite.js auto

# Or with environment variables
MAX_CYCLES=5 SCRAPE_BATCH_SIZE=100 node run-lite.js auto
```

## How It Works

The automated cycle runs:
1. **Discovery** - Finds new URLs from seed pages
2. **Scraping** - Processes queued URLs in batches
3. **Pattern Learning** - Learns URL patterns from successful pages
4. **Extraction Analysis** - Analyzes extraction quality
5. **Retry Logic** - Automatically retries failed jobs
6. **Self-Improvement** - Uses insights to improve extraction

## Features

### ✅ Automatic Discovery
- Discovers new URLs from seed pages
- Uses learned patterns to identify program pages
- Detects overview pages automatically

### ✅ Intelligent Scraping
- Processes jobs in batches (configurable size)
- Stops when no new URLs found
- Limits cycles to prevent infinite loops

### ✅ Pattern Learning
- Learns URL patterns from successful pages
- Distinguishes good vs. bad pages
- Updates patterns automatically after each scrape

### ✅ Self-Improvement
- Analyzes extraction quality
- Identifies sites with good extraction rates
- Tracks successful extraction patterns
- Creates feedback loop for continuous improvement

### ✅ Automatic Retry
- Retries failed jobs automatically (up to 3 attempts)
- Marks jobs as failed only after max retries

## Environment Variables

```bash
# Number of cycles to run (default: 10)
MAX_CYCLES=5

# Minimum new URLs to continue (default: 5)
MIN_NEW_URLS=10

# Batch size for scraping (default: 100)
SCRAPE_BATCH_SIZE=50

# Max discovery pages per cycle (default: 200)
LITE_MAX_DISCOVERY_PAGES=300

# Use all institutions (default: false, uses first 3)
LITE_ALL_INSTITUTIONS=1

# Custom seed URLs (comma-separated)
LITE_SEEDS="https://www.ffg.at/en/fundings,https://www.aws.at/foerderungen"
```

## Example: Continuous Monitoring

```bash
# Run automated cycle
node run-lite.js auto

# Check status
node scripts/monitor-improvements.js
node scripts/monitor-metadata.js

# Learn patterns manually (if needed)
node scripts/learn-patterns-from-scraped.js

# Analyze extraction quality
node scripts/improve-extraction.js
```

## Scheduling (Optional)

### Windows Task Scheduler
Create a task to run:
```batch
cd C:\path\to\scraper-lite
node run-lite.js auto
```

### Linux/Mac Cron
```bash
# Run daily at 2 AM
0 2 * * * cd /path/to/scraper-lite && node run-lite.js auto >> logs/auto-cycle.log 2>&1
```

### Using PM2 (Node.js Process Manager)
```bash
pm2 start run-lite.js --name "scraper-auto" --cron "0 2 * * *" --no-autorestart
```

## Self-Improvement Mechanism

The system automatically:

1. **Learns from Success**
   - Tracks which URL patterns lead to good pages
   - Identifies sites with high extraction rates
   - Adapts patterns over time

2. **Improves Extraction**
   - Analyzes which extraction methods work best
   - Identifies sites needing different approaches
   - Suggests improvements based on data

3. **Quality Monitoring**
   - Tracks meaningfulness rates
   - Monitors metadata extraction
   - Reports on extraction quality

## Output Files

- `data/lite/state.json` - Current scraping state
- `data/lite/url-patterns.json` - Learned URL patterns
- `data/lite/extraction-insights.json` - Extraction quality insights

## Monitoring

After running, check status:

```bash
# Overall extraction quality
node scripts/monitor-improvements.js

# Metadata extraction
node scripts/monitor-metadata.js

# Quick summary
node scripts/quick-summary.js
```

## Troubleshooting

### Cycle stops early
- Check `MIN_NEW_URLS` - may be too high
- Check if seeds are still producing new URLs

### Too many failed jobs
- Some sites may have changed structure
- Check network/access issues
- Review exclusion patterns

### Low extraction quality
- Run `node scripts/improve-extraction.js` to analyze
- Check `extraction-insights.json` for patterns
- Some sites may need custom extraction logic

## Best Practices

1. **Start Small**: Run with `MAX_CYCLES=3` first to test
2. **Monitor Results**: Check extraction quality after each run
3. **Adjust Batch Size**: Smaller batches = more frequent pattern learning
4. **Regular Runs**: Schedule daily/weekly for fresh data
5. **Review Patterns**: Occasionally check `url-patterns.json` for unusual patterns


