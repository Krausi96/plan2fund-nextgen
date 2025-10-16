# Plan2Fund Scripts

This directory contains essential automation scripts for database management and system utilities.

## 📁 Directory Structure

### `/database/` - Database Management
- **setup-database.sql** - Initial database schema creation
- **migrate-database.sql** - Database migration scripts
- **migrate-enhanced-requirements.sql** - Requirements migration
- **add-categorized-requirements.js** - Category migration
- **migrate.js** - Migration runner
- **fix-json-data.sql** - Data correction scripts

### Core Scripts - System Utilities
- **run-tests.mjs** - Test runner
- **ci-coverage.mjs** - Coverage reporting
- **generate-source-register.mjs** - Source registration
- **migrate-to-json.js** - Data migration utility
- **update-fallback-data.js** - Fallback data updates

## 🚀 Quick Start

### Database Setup
```bash
# Run in NEON SQL editor
cat scripts/database/setup-database.sql
```

### Database Migration
```bash
# Run database migrations
node scripts/database/migrate.js
```

### Testing
```bash
# Run tests
npm run test

# Generate coverage report
npm run coverage
```

### Data Management
```bash
# Update fallback data
node scripts/update-fallback-data.js

# Generate source register
npm run source:register
```

## 📋 Script Categories

### Database Scripts
- **Setup**: Create tables and initial data
- **Migration**: Add new columns and features
- **Fix**: Correct data issues

### Core Utilities
- **Testing**: Test runner and coverage
- **Data Management**: Fallback data and source registration
- **Migration**: Data format conversions

## 🔧 Usage

All scripts are designed to be run from the project root directory. Use npm scripts when available for better integration.
