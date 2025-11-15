# Scraper-Lite

**On-demand scraping + LLM enrichment for funding programs**

## Goal

**2500 valid programs from 200-300 institutions**
- 80% Austrian programs
- 10% EU calls
- 10% Other European countries

## Quick Start

1. **Seed the catalog** – edit `scraper-lite/url-catalog.json` so every target institution + funding type has at least one reliable URL entry.
2. **Start the worker** – `npx tsx scraper-lite/api/scrape-worker.ts` (polls the in-memory queue and writes results to Postgres).
3. **Trigger scrapes** – `POST /api/programs/ondemand/scrape` with `{ url }` or `{ urls: [] }` to enqueue work; cached responses return immediately.
4. **Check status** – `GET /api/programs/ondemand/status/{jobId}` or run `npx tsx scraper-lite/check-status.ts` for aggregate metrics.

## Structure

```
scraper-lite/
├── api/                    # On-demand queue + worker
│   ├── cache-manager.ts    # 7-day cache lookup
│   ├── job-queue.ts        # Lightweight in-memory queue
│   └── scrape-worker.ts    # Background processor
├── db/                     # Postgres helpers (pages, requirements, queue)
├── src/
│   ├── config/             # Institution + scraping configuration
│   ├── core/               # LLM extraction pipeline
│   └── utils/              # HTTP, normalization, blacklist, etc.
├── url-catalog.json        # Source-of-truth URL catalog (seed + overview)
└── tmp/                    # Generated reports (failures, etc.)
```

## How It Works

1. Use `url-catalog.json` + `src/config/institutionConfig.ts` to identify high-value programme URLs per institution.
2. `POST /api/programs/ondemand/scrape` enqueues each target URL (batch size ≤ 10).
3. `scrape-worker` fetches HTML, runs LLM extraction, normalises metadata, and persists pages + requirements.
4. `cache-manager` returns recent results instantly (≤ 7 days) to avoid redundant scraping.
5. Programme data flows straight into programme search, recommendations, and editor features through the shared DB layer.

## Maintaining Coverage

- Keep the institution list in sync: update `src/config/institutionConfig.ts` when adding or pruning target partners.
- Ensure `url-catalog.json` has at least one high-signal URL per funding type and region we support (Austria focus + selected EU programmes).
- Use `scraper-lite/analyze-failures.ts` to inspect failed jobs and adjust selectors, blacklist rules, or seed URLs.
- Refresh stale entries by re-posting URLs once cache TTL expires or when major content changes occur.

The curated batch pipeline is gone—everything now flows through the live queue. If you need historical scripts for reference, ask the team to restore them from git history.

**The scraper is fully autonomous!** Just run the main command and it handles discovery, scraping, learning, feedback integration, and re-scraping automatically. 🚀


**The scraper is fully autonomous!** Just run the main command and it handles discovery, scraping, learning, feedback integration, and re-scraping automatically. 🚀

