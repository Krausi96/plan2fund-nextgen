# Priority 3: Database Connection Fix

## Issues Identified

1. **TypeScript Module Loading**: Next.js API routes use `require()` to load TypeScript modules, which can fail if not properly compiled
2. **Error Handling**: Errors were not detailed enough to diagnose connection issues
3. **TypeScript Configuration**: `tsconfig.json` didn't include `scraper-lite/src` directory

## Fixes Applied

### 1. Improved Error Handling (`pages/api/programs.ts`)

**Before:**
```typescript
try {
  const { searchPages, getAllPages } = require('../../scraper-lite/src/db/page-repository');
  // ...
} catch (error: any) {
  console.warn('⚠️ Database load failed, trying JSON fallback...');
  console.warn('   Error:', error.message);
}
```

**After:**
```typescript
try {
  // Check DATABASE_URL first
  if (!process.env.DATABASE_URL) {
    console.warn('⚠️ DATABASE_URL not set, using JSON fallback');
    throw new Error('DATABASE_URL not configured');
  }
  
  let searchPages: any;
  let getAllPages: any;
  
  try {
    const pageRepo = require('../../scraper-lite/src/db/page-repository');
    searchPages = pageRepo.searchPages;
    getAllPages = pageRepo.getAllPages;
  } catch (requireError: any) {
    console.error('❌ Failed to load page-repository:', requireError.message);
    console.error('   This might be a TypeScript compilation issue');
    throw new Error(`Failed to load database module: ${requireError.message}`);
  }
  // ...
} catch (error: any) {
  console.warn('⚠️ Database load failed, trying JSON fallback...');
  console.warn('   Error type:', error.constructor.name);
  console.warn('   Error message:', error.message);
  if (error.stack) {
    console.warn('   Stack trace:', error.stack.split('\n').slice(0, 5).join('\n'));
  }
  
  // Specific error diagnostics
  if (error.message?.includes('Cannot find module') || error.message?.includes('Failed to load')) {
    console.error('❌ CRITICAL: Database module loading failed.');
    console.error('   Possible fixes:');
    console.error('   1. Ensure Next.js is running (restart dev server)');
    console.error('   2. Check that scraper-lite/src/db/*.ts files exist');
    console.error('   3. Verify tsconfig.json includes scraper-lite directory');
  } else if (error.message?.includes('DATABASE_URL')) {
    console.error('❌ CRITICAL: DATABASE_URL not configured.');
    console.error('   Add DATABASE_URL to .env.local file');
  } else if (error.message?.includes('connection') || error.message?.includes('ECONNREFUSED')) {
    console.error('❌ CRITICAL: Database connection failed.');
    console.error('   Check DATABASE_URL and network connectivity');
  }
}
```

**Benefits:**
- ✅ Checks `DATABASE_URL` before attempting connection
- ✅ Separates module loading errors from connection errors
- ✅ Provides specific troubleshooting steps
- ✅ Better error messages for debugging

### 2. Updated TypeScript Configuration (`tsconfig.json`)

**Before:**
```json
"include": [
  "src",
  "pages",
  "features",
  "shared"
]
```

**After:**
```json
"include": [
  "src",
  "pages",
  "features",
  "shared",
  "scraper-lite/src"
]
```

**Benefits:**
- ✅ Next.js will compile TypeScript files in `scraper-lite/src`
- ✅ TypeScript modules can be properly resolved
- ✅ Better IDE support for database modules

### 3. Improved Neon Client Loading

**Before:**
```typescript
const { getPool } = require('../../scraper-lite/src/db/neon-client');
```

**After:**
```typescript
let getPool: any;
try {
  const neonClient = require('../../scraper-lite/src/db/neon-client');
  getPool = neonClient.getPool;
} catch (requireError: any) {
  console.error('❌ Failed to load neon-client:', requireError.message);
  throw new Error(`Failed to load database client: ${requireError.message}`);
}
```

**Benefits:**
- ✅ Catches module loading errors separately
- ✅ Better error messages
- ✅ Easier debugging

## Current Status

### Environment
- ✅ `.env.local` exists
- ✅ `DATABASE_URL` is set in `.env.local`

### Next Steps to Test

1. **Restart Next.js dev server** (if running)
   ```bash
   # Stop current server (Ctrl+C)
   npm run dev
   ```

2. **Test API endpoint**
   ```bash
   curl http://localhost:3000/api/programs
   ```

3. **Check server logs** for:
   - ✅ `DATABASE_URL found` (not "not set")
   - ✅ `Connection successful` (not "failed")
   - ✅ `Pages table accessible: X pages`
   - ✅ `Requirements table accessible: X requirements`

4. **Verify database connection**
   - Check if programs load from database (not JSON fallback)
   - Check server logs for "Database load failed" warnings

## Troubleshooting

### If "Cannot find module" error:

1. **Check TypeScript compilation:**
   ```bash
   npx tsc --noEmit
   ```

2. **Verify files exist:**
   ```bash
   ls scraper-lite/src/db/neon-client.ts
   ls scraper-lite/src/db/page-repository.ts
   ```

3. **Restart Next.js dev server:**
   ```bash
   # Stop and restart
   npm run dev
   ```

### If "DATABASE_URL not set" error:

1. **Check `.env.local` exists:**
   ```bash
   cat .env.local | grep DATABASE_URL
   ```

2. **Verify Next.js loads it:**
   - Next.js automatically loads `.env.local` in API routes
   - Restart dev server after changing `.env.local`

### If "Connection failed" error:

1. **Test connection directly:**
   ```bash
   node scripts/test-db-connection.js
   ```

2. **Check connection string format:**
   ```
   postgresql://user:pass@host.neon.tech/dbname?sslmode=require
   ```

3. **Verify network connectivity:**
   - Check if you can reach `ep-winter-grass-agmbjcan-pooler.c-2.eu-central-1.aws.neon.tech`
   - Check firewall settings

## Expected Behavior After Fix

**Before:**
- ❌ Database connection silently fails
- ❌ Falls back to JSON without clear error message
- ❌ No indication of what went wrong

**After:**
- ✅ Clear error messages for each failure type
- ✅ Specific troubleshooting steps
- ✅ Checks `DATABASE_URL` before attempting connection
- ✅ Better separation of module loading vs connection errors

## Files Modified

1. `pages/api/programs.ts` - Improved error handling
2. `tsconfig.json` - Added `scraper-lite/src` to includes
3. `scripts/test-db-connection.js` - Test script (created)

