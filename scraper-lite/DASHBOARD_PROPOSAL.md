# Dashboard Proposal for Scraper Monitoring

## Overview

A dashboard to monitor the full cycle: discovery → scraping → learning → analysis. This provides visibility into what's working, what's failing, and what patterns are being learned.

## Why a Dashboard?

**Current Issues:**
- Hard to see overall system health
- Difficult to track what's being learned
- No visibility into discovery effectiveness
- Can't easily spot patterns in failures
- Learning progress is unclear

**Benefits:**
- Real-time monitoring of scraper health
- Visualize learning progress
- Identify issues quickly
- Track discovery effectiveness
- Monitor data quality trends

## Dashboard Architecture

### Option 1: Simple Web Dashboard (Recommended for Start)

**Tech Stack:**
- **Backend**: Express.js API (reads from PostgreSQL)
- **Frontend**: React + Chart.js / Recharts
- **Real-time**: WebSocket or polling every 5-10 seconds

**Why This:**
- Quick to build
- Uses existing database
- No additional infrastructure
- Can deploy as separate service

### Option 2: Next.js Dashboard (If Already Using Next.js)

**Tech Stack:**
- **Framework**: Next.js (API routes + React)
- **Charts**: Recharts or Chart.js
- **Database**: Direct PostgreSQL queries

**Why This:**
- Integrates with existing Next.js app
- Server-side rendering
- Built-in API routes

### Option 3: Simple CLI Dashboard

**Tech Stack:**
- **Tool**: Node.js script with `blessed` or `ink`
- **Output**: Terminal-based dashboard

**Why This:**
- No web server needed
- Quick to implement
- Good for local monitoring

## Recommended: Option 1 (Simple Web Dashboard)

### Structure

```
scraper-lite/dashboard/
├── server/
│   ├── index.ts          # Express server
│   ├── routes/
│   │   ├── stats.ts      # Statistics endpoints
│   │   ├── learning.ts   # Learning metrics
│   │   └── discovery.ts  # Discovery metrics
│   └── db.ts             # Database queries
├── client/
│   ├── index.html
│   ├── app.js            # React app
│   └── components/
│       ├── StatsPanel.jsx
│       ├── LearningChart.jsx
│       ├── DiscoveryChart.jsx
│       └── IssuesList.jsx
└── package.json
```

### Key Metrics to Display

#### 1. Discovery Metrics
- **Total Seed URLs**: Hardcoded + Discovered
- **New Seeds Discovered**: This cycle / Total
- **URLs Queued**: This cycle / Total queue
- **Discovery Rate**: URLs discovered per hour
- **Top Discovery Sources**: Which pages are finding most URLs

#### 2. Scraping Metrics
- **Pages Scraped**: Today / Total
- **Success Rate**: % successful extractions
- **Average Requirements**: Per page
- **Scraping Speed**: Pages per hour
- **Queue Status**: Pending / Processing / Failed

#### 3. Learning Metrics
- **Classification Accuracy**: Current % (with trend)
- **Quality Rules**: Count learned
- **Requirement Patterns**: Categories with patterns
- **URL Patterns**: Total patterns learned
- **Learning Progress**: % toward next learning threshold

#### 4. Issues & Errors
- **Failed URLs**: Recent failures with reasons
- **404 Errors**: Count and auto-blacklisted
- **Login Failures**: URLs requiring login
- **Low Quality Pages**: Pages with <5 requirements
- **Common Errors**: Error frequency chart

#### 5. Data Quality
- **Funding Types**: Distribution chart
- **Requirements per Category**: Bar chart
- **Institution Coverage**: Pages per institution
- **Data Completeness**: % pages with all required fields

### API Endpoints

```typescript
// GET /api/stats/overview
{
  discovery: {
    totalSeeds: 280,
    discoveredSeeds: 15,
    urlsQueued: 42,
    discoveryRate: 5.2 // per hour
  },
  scraping: {
    scrapedToday: 23,
    successRate: 0.87,
    avgRequirements: 8.5,
    queueSize: 18
  },
  learning: {
    accuracy: 69.5,
    qualityRules: 0,
    requirementPatterns: 19,
    urlPatterns: 217
  }
}

// GET /api/learning/progress
{
  accuracy: { current: 69.5, trend: [68, 69, 69.5] },
  qualityRules: { learned: 0, needed: 50 },
  patterns: { requirement: 19, url: 217 }
}

// GET /api/discovery/sources
[
  { source: "overview_page", count: 12, urlsFound: 45 },
  { source: "listing_page", count: 3, urlsFound: 18 },
  { source: "scraped_page", count: 8, urlsFound: 22 }
]

// GET /api/issues/recent
[
  { type: "404", count: 5, urls: [...] },
  { type: "login_required", count: 2, urls: [...] },
  { type: "low_quality", count: 8, urls: [...] }
]
```

### Implementation Steps

#### Phase 1: Basic Stats API (1-2 hours)
1. Create Express server
2. Add database query functions
3. Create `/api/stats/overview` endpoint
4. Test with Postman/curl

#### Phase 2: Simple HTML Dashboard (2-3 hours)
1. Create HTML page with charts
2. Use Chart.js for visualizations
3. Poll API every 10 seconds
4. Display key metrics

#### Phase 3: Enhanced Features (3-4 hours)
1. Add learning progress charts
2. Add issues list
3. Add discovery source breakdown
4. Add historical trends

#### Phase 4: Real-time Updates (2-3 hours)
1. Add WebSocket support
2. Push updates when scraping completes
3. Auto-refresh on new data

## Quick Start Implementation

I can create a minimal dashboard in ~30 minutes:

1. **Express API** (`dashboard/server/index.ts`)
   - 3-4 endpoints for key metrics
   - Direct database queries

2. **Simple HTML Dashboard** (`dashboard/client/index.html`)
   - Chart.js for visualizations
   - Auto-refresh every 10 seconds
   - Shows: Stats, Learning, Issues

3. **Run alongside scraper**
   - `npm run dashboard` (starts on port 3001)
   - View at `http://localhost:3001`

## Alternative: Database Views + SQL Queries

If you prefer SQL over a web dashboard:

```sql
-- Create views for common queries
CREATE VIEW discovery_stats AS
SELECT 
  COUNT(*) FILTER (WHERE source_type = 'overview_page') as overview_seeds,
  COUNT(*) FILTER (WHERE source_type = 'listing_page') as listing_seeds,
  COUNT(*) as total_discovered_seeds
FROM discovered_seed_urls
WHERE is_active = true;

CREATE VIEW scraping_stats AS
SELECT 
  COUNT(*) as total_pages,
  COUNT(*) FILTER (WHERE array_length(requirements, 1) >= 5) as good_pages,
  AVG(array_length(requirements, 1)) as avg_requirements
FROM pages;

-- Query anytime: SELECT * FROM discovery_stats;
```

## Recommendation

**Start with Option 1 (Simple Web Dashboard)** because:
- ✅ Quick to build (can have basic version in 1-2 hours)
- ✅ Visual and easy to understand
- ✅ Can expand later
- ✅ No complex infrastructure

**Then add:**
- Historical data storage (for trends)
- Alerts for critical issues
- Export functionality
- Filtering/search

Would you like me to implement the basic dashboard now?

