# Setting Up Automatic Scraper Scheduling

## Current Status: Manual Only

The scraper currently requires **manual execution**. You need to run it yourself or set up scheduling.

## Option 1: Manual Run (Quick Start)

### Windows PowerShell:
```powershell
# Run full automatic cycle
.\scraper-lite\run-cycle.ps1
```

### Windows CMD:
```cmd
scraper-lite\run-cycle.bat
```

### Direct Node.js:
```bash
node scraper-lite/manual auto
```

This runs ONE complete cycle (discovery → scrape → analyze → improve). You'd need to run this again manually later.

---

## Option 2: Set Up Automatic Scheduling

### 🪟 Windows Task Scheduler (Recommended for Windows)

1. **Open Task Scheduler** (search "Task Scheduler" in Windows)

2. **Create Basic Task:**
   - Name: `Scraper Lite Auto Cycle`
   - Description: `Runs scraper discovery, scraping, and analysis automatically`

3. **Trigger:**
   - Choose: "Daily" or "Weekly" or "When computer starts"
   - Set time (e.g., 2:00 AM daily)

4. **Action:**
   - Action: "Start a program"
   - Program/script: `node`
   - Arguments: `scraper-lite\scripts\automatic\auto-cycle-scheduler.js`
   - Start in: `C:\Users\kevin\plan2fund\one_prompt_webapp_agent_package\plan2fund-nextgen`

5. **Conditions:**
   - ✅ Check "Start the task only if the computer is on AC power" (if laptop)
   - ✅ Check "Wake the computer to run this task" (if needed)

6. **Settings:**
   - ✅ Check "Run task as soon as possible after a scheduled start is missed"
   - ✅ Check "If the task fails, restart every: 1 hour" (optional)

### 🐧 Linux/Mac Cron

Edit crontab:
```bash
crontab -e
```

Add line (runs daily at 2 AM):
```bash
0 2 * * * cd /path/to/plan2fund-nextgen && node scraper-lite/scripts/automatic/auto-cycle-scheduler.js >> scraper-lite/logs/auto-cycle.log 2>&1
```

Or hourly:
```bash
0 * * * * cd /path/to/plan2fund-nextgen && node scraper-lite/scripts/automatic/auto-cycle-scheduler.js >> scraper-lite/logs/auto-cycle.log 2>&1
```

### 🔄 PM2 (Node.js Process Manager) - Recommended

1. **Install PM2:**
   ```bash
   npm install -g pm2
   ```

2. **Start scheduler (runs hourly):**
   ```bash
   cd scraper-lite
   pm2 start scripts/automatic/auto-cycle-scheduler.js --name scraper-hourly --cron "0 * * * *" --no-autorestart
   ```

3. **Or daily at 2 AM:**
   ```bash
   pm2 start scripts/automatic/auto-cycle-scheduler.js --name scraper-daily --cron "0 2 * * *" --no-autorestart
   ```

4. **PM2 Management:**
   ```bash
   pm2 list              # Show running processes
   pm2 logs scraper-hourly  # View logs
   pm2 stop scraper-hourly  # Stop
   pm2 delete scraper-hourly # Remove
   pm2 save              # Save current process list
   pm2 startup           # Auto-start PM2 on system boot
   ```

---

## Option 3: Continuous Background Service

### Using PM2 (Keeps Running)

```bash
# Start as continuous service (runs every hour, waits for completion)
pm2 start scripts/automatic/auto-cycle-scheduler.js --name scraper-service --cron "0 * * * *"

# Save and enable startup
pm2 save
pm2 startup
```

This will:
- Run every hour automatically
- Keep running even after system restart
- Log all output
- Restart if process crashes

---

## Configuration

### Environment Variables (Optional)

Create or edit `.env.local`:
```bash
# Number of cycles to run (default: 10)
MAX_CYCLES=10

# Minimum new URLs to continue (default: 5)
MIN_NEW_URLS=5

# Batch size for scraping (default: 100)
SCRAPE_BATCH_SIZE=50

# Max discovery pages per cycle (default: 200)
LITE_MAX_DISCOVERY_PAGES=200

# Use all institutions (default: first 3 only)
LITE_ALL_INSTITUTIONS=1

# Database connection (required)
DATABASE_URL=postgresql://...
```

---

## Monitoring

### Check Logs

**Windows Task Scheduler:**
- View in Task Scheduler → History tab
- Or check log files if configured

**PM2:**
```bash
pm2 logs scraper-hourly
```

**Manual:**
```bash
# Check what was scraped
node scraper-lite/scripts/manual/quick-summary.js

# Check quality
node scraper-lite/scripts/manual/verify-database-quality.js

# Check database
node scripts/test-db-connection.js
```

---

## Recommended Setup

For **Windows Development:**
1. Use **Windows Task Scheduler** (easiest)
2. Set to run daily at 2 AM
3. Or use PM2 if you have Node.js development environment

For **Production/Server:**
1. Use **PM2** with cron scheduling
2. Set up PM2 startup script
3. Monitor with `pm2 logs`

---

## Troubleshooting

### Scheduler not running?
- Check if Node.js path is correct in Task Scheduler
- Check if `.env.local` is accessible
- Check if DATABASE_URL is set
- Check logs for errors

### Want to run immediately?
```bash
node scraper-lite/manual auto
```

### Want to test scheduler?
```bash
node scraper-lite/scripts/automatic/auto-cycle-scheduler.js
```

