# Scraper Dashboard

Simple web dashboard to monitor scraper health, discovery, learning, and issues.

## How to Run

### 1. Install Dependencies (if needed)

```bash
npm install express cors
npm install --save-dev @types/express @types/cors
```

### 2. Start the Dashboard

```bash
npm run dashboard
```

The dashboard will start on **http://localhost:3001**

### 3. Open in Browser

Open your browser and go to:
```
http://localhost:3001
```

## What It Shows

- **Discovery Stats**: Total seed URLs, discovered seeds, queue status
- **Scraping Stats**: Pages scraped today, success rate, average requirements
- **Learning Stats**: Classification accuracy, patterns learned
- **Funding Types**: Distribution chart
- **Discovery Sources**: Overview vs listing pages
- **Recent Issues**: 404 errors, login required, low quality pages

## Auto-Refresh

The dashboard automatically refreshes every 10 seconds to show the latest data.

## Running Alongside Scraper

You can run the dashboard in one terminal and the scraper in another:

**Terminal 1:**
```bash
npm run dashboard
```

**Terminal 2:**
```bash
npm run scraper:unified -- full --max=10
```

The dashboard will show real-time updates as the scraper runs.

## Customization

- **Change Port**: Set `DASHBOARD_PORT` environment variable
- **Modify Refresh Rate**: Edit `setInterval(fetchData, 10000)` in `client/index.html`
- **Add More Metrics**: Add new API endpoints in `server.ts` and update the HTML

## Troubleshooting

**Dashboard won't start:**
- Check if port 3001 is already in use
- Make sure DATABASE_URL is set in `.env.local`

**No data showing:**
- Verify database connection
- Check that scraper has run at least once
- Look at browser console for errors

