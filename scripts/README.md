# Plan2Fund Scripts

This directory contains all automation scripts organized by category.

## 📁 Directory Structure

### `/database/`
- **setup-database.sql** - Initial database schema creation
- **migrate-database.sql** - Database migration scripts
- **fix-json-data.sql** - Data correction scripts

### `/testing/`
- **test-*.js** - Automated testing scripts
- **test-scraper-api.js** - Scraper API testing
- **test-vercel-complete.js** - Complete system testing

### `/deployment/`
- Deployment and CI/CD scripts

## 🚀 Quick Start

### Database Setup
```bash
# Run in NEON SQL editor
cat scripts/database/setup-database.sql
```

### Testing
```bash
# Test scraper API locally
node scripts/testing/test-scraper-api.js

# Test complete system
node scripts/testing/test-vercel-complete.js
```

## 📋 Script Categories

### Database Scripts
- **Setup**: Create tables and initial data
- **Migration**: Add new columns and features
- **Fix**: Correct data issues

### Testing Scripts
- **API Testing**: Test all API endpoints
- **Integration Testing**: Test complete workflows
- **Performance Testing**: Test system performance

### Deployment Scripts
- **Build**: Build and prepare for deployment
- **Deploy**: Deploy to production
- **Monitor**: Monitor deployment health

## 🔧 Usage

All scripts are designed to be run from the project root directory. Check individual script files for specific usage instructions.
