# 📊 Data Management Guide

## 🎯 **SMART DATA RETENTION STRATEGY**

### **Current Data Accumulation Problem**
- **Per scraping session**: ~500KB (quick) / ~2MB (full)
- **Daily scraping**: 500KB × 30 days = **15MB**
- **With full mode**: 2MB × 30 days = **60MB**
- **Plus learning data**: 50KB × 30 days = **1.5MB**
- **Total after 30 days**: ~76MB (growing!)

### **Optimized Data Management Solution**

## 📁 **Data Storage Structure**

```
data/
├── scraped-programs-latest.json      # Current data (always kept)
├── scraped-programs-2025-10-21.json  # Historical data (7 days max)
├── scraped-programs-2025-10-20.json  # Historical data (7 days max)
├── scraped-programs-2025-10-19.json  # Historical data (7 days max)
├── scraper-learning.json             # Learning data (compressed)
└── fallback-programs.json            # Static fallback (never changes)
```

## ⏰ **Cron Job Schedule**

### **Quick Updates (Every 6 Hours)**
```bash
0 */6 * * * cd /path/to/plan2fund-nextgen && node scripts/optimized-scraper-cron.js quick
```
- **Purpose**: Keep data fresh
- **Data size**: ~500KB per run
- **Frequency**: 4 times per day
- **Total daily**: ~2MB

### **Full Updates (Daily at 2 AM)**
```bash
0 2 * * * cd /path/to/plan2fund-nextgen && node scripts/optimized-scraper-cron.js full
```
- **Purpose**: Comprehensive data collection
- **Data size**: ~2MB per run
- **Frequency**: Once daily
- **Total daily**: ~2MB

### **Cleanup (Daily at 3 AM)**
```bash
0 3 * * * cd /path/to/plan2fund-nextgen && node scripts/optimized-scraper-cron.js cleanup
```
- **Purpose**: Remove old data
- **Retention**: 7 days (not 30!)
- **Total storage**: ~14MB (7 days × 2MB)

## 🗜️ **Data Compression & Cleanup**

### **Automatic Cleanup Rules**

1. **Historical Files**: Keep only 7 most recent
2. **Learning Data**: Compress when > 10MB
3. **Old Patterns**: Remove patterns older than 30 days
4. **Low Performance**: Remove patterns with < 30% success rate

### **Data Size After Optimization**

- **7 days of data**: ~14MB (instead of 60MB)
- **Learning data**: ~5MB (compressed)
- **Fallback data**: ~200KB (static)
- **Total storage**: ~19MB (instead of 76MB)

## 🚀 **How to Set Up**

### **1. Install the Cron Job**

```bash
# Copy the example crontab
cp scripts/crontab-example.txt /tmp/my-crontab

# Edit the paths in the file
nano /tmp/my-crontab

# Install the crontab
crontab /tmp/my-crontab
```

### **2. Create Log Directory**

```bash
mkdir -p logs
```

### **3. Test the System**

```bash
# Test quick scraping
node scripts/optimized-scraper-cron.js quick

# Test full scraping
node scripts/optimized-scraper-cron.js full

# Test cleanup
node scripts/optimized-scraper-cron.js cleanup

# Check stats
node scripts/optimized-scraper-cron.js stats
```

## 📊 **Monitoring & Alerts**

### **Data Size Monitoring**

```bash
# Check current data size
du -sh data/

# Check data stats
node scripts/optimized-scraper-cron.js stats
```

### **Log Monitoring**

```bash
# Check quick scraping logs
tail -f logs/scraper-quick.log

# Check full scraping logs
tail -f logs/scraper-full.log

# Check cleanup logs
tail -f logs/scraper-cleanup.log
```

## 🔧 **Customization**

### **Adjust Retention Periods**

Edit `scripts/optimized-scraper-cron.js`:

```javascript
const CONFIG = {
  retention: {
    latest: 'always',           // Keep latest data forever
    historical: 7,              // Change to 14 for 2 weeks
    learning: 30,               // Keep learning data for 30 days
    fallback: 'always'          // Keep fallback data forever
  },
  
  limits: {
    maxHistoricalFiles: 7,      // Change to 14 for 2 weeks
    maxLearningSize: '10MB',    // Change to 20MB if needed
    maxProgramsPerFile: 1000    // Max programs per file
  }
};
```

### **Adjust Scraping Frequency**

Edit `scripts/crontab-example.txt`:

```bash
# More frequent quick updates (every 4 hours)
0 */4 * * * cd /path/to/plan2fund-nextgen && node scripts/optimized-scraper-cron.js quick

# Less frequent full updates (every 2 days)
0 2 */2 * * * cd /path/to/plan2fund-nextgen && node scripts/optimized-scraper-cron.js full
```

## 🎯 **Benefits of This Approach**

### **✅ Data Management**
- **75% reduction** in storage (19MB vs 76MB)
- **Automatic cleanup** (no manual intervention)
- **Smart retention** (keep what matters)

### **✅ Performance**
- **Quick updates** keep data fresh
- **Full updates** ensure completeness
- **Compressed learning** data

### **✅ Reliability**
- **4-layer fallback** system
- **Automatic error handling**
- **Logging and monitoring**

### **✅ Scalability**
- **Configurable retention** periods
- **Adjustable scraping** frequency
- **Easy to extend** with new features

## 🚨 **Important Notes**

1. **Always test** the cron jobs before deploying
2. **Monitor logs** for errors
3. **Adjust retention** based on your needs
4. **Backup important** data before cleanup
5. **Check disk space** regularly

## 📈 **Expected Results**

After implementing this system:

- **Storage usage**: ~19MB (instead of 76MB)
- **Data freshness**: Updated every 6 hours
- **Completeness**: Full update daily
- **Maintenance**: Fully automated
- **Reliability**: 4-layer fallback system

**The system will manage itself and prevent data accumulation!** 🚀✨
