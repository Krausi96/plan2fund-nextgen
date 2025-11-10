# Dashboard Quick Start

## 🚀 Run the Dashboard

### Step 1: Install Dependencies (one-time)

```bash
npm install express cors
npm install --save-dev @types/express @types/cors
```

### Step 2: Start the Dashboard

```bash
npm run dashboard
```

You'll see:
```
📊 Dashboard server running on http://localhost:3001
   Open http://localhost:3001 in your browser
```

### Step 3: Open in Browser

Open your browser and go to:
```
http://localhost:3001
```

## 📊 What You'll See

- **Discovery Stats**: Total seed URLs, discovered seeds, queue status
- **Scraping Stats**: Pages scraped today, success rate
- **Learning Stats**: Classification accuracy, patterns learned
- **Charts**: Funding types distribution, discovery sources
- **Issues**: Recent 404 errors, login failures, low quality pages

## 🔄 Auto-Refresh

The dashboard automatically refreshes every 10 seconds.

## 💡 Running Dashboard + Scraper

**Terminal 1** (Dashboard):
```bash
npm run dashboard
```

**Terminal 2** (Scraper):
```bash
npm run scraper:unified -- full --max=10
```

Watch the dashboard update in real-time as the scraper runs!

## 🛠️ Customize Port

Set environment variable:
```bash
DASHBOARD_PORT=3002 npm run dashboard
```

## ❓ Troubleshooting

**Port already in use?**
- Change port: `DASHBOARD_PORT=3002 npm run dashboard`
- Or stop the process using port 3001

**No data showing?**
- Make sure DATABASE_URL is set in `.env.local`
- Run scraper at least once to populate data
- Check browser console for errors

