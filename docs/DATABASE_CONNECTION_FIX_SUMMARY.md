# Database Connection Fix - Summary

## Changes Made

### 1. Switched to Dynamic Import (`pages/api/programs.ts`)

**Before:**
```typescript
const pageRepo = require('../../scraper-lite/src/db/page-repository');
```

**After:**
```typescript
const pageRepo = await import('../../scraper-lite/src/db/page-repository');
```

**Why:**
- Next.js handles TypeScript modules better with `import()` than `require()`
- Matches the pattern used in `pages/api/user/profile.ts` (which works)
- Better compatibility with Next.js webpack bundling

### 2. Updated Webpack Config (`next.config.js`)

**Added:**
```javascript
else {
  // Server-side: Allow TypeScript files from scraper-lite
  config.resolve.extensionAlias = {
    '.js': ['.ts', '.tsx', '.js', '.jsx'],
    '.jsx': ['.tsx', '.jsx'],
  };
}
```

**Why:**
- Ensures webpack can resolve TypeScript files from scraper-lite
- Only applies to server-side (isServer = true)

### 3. Fixed TypeScript Error

**Fixed:**
- `type` from `req.query` can be `string | string[]`
- Added type check: `type && typeof type === 'string'`

### 4. Updated `pages/api/programs-ai.ts`

**Changed:**
- From `require()` to `await import()` for consistency

## Testing

**Current Status:** Still using fallback (`source: "fallback"`)

**Next Steps:**
1. **Restart Next.js dev server** (required for webpack changes)
   ```bash
   # Stop current server (Ctrl+C)
   npm run dev
   ```

2. **Check server logs** for:
   - ✅ `✅ Using pre-filtered programs from QuestionEngine`
   - ✅ `✅ Returning X programs from database`
   - OR error messages with specific diagnostics

3. **Test API endpoint:**
   ```bash
   curl http://localhost:3000/api/programs?enhanced=true
   ```

4. **Verify response:**
   - Look for `"source": "database"` (success)
   - Or `"source": "fallback"` (check logs for error)

## Expected Behavior

**After restart:**
- Dynamic imports should work correctly
- TypeScript modules should load properly
- Database connection should succeed (if DATABASE_URL is correct)

**If still failing:**
- Check server console logs for specific error
- Error handling will show:
  - Module loading errors
  - DATABASE_URL issues
  - Connection errors
  - Specific troubleshooting steps

## Files Modified

1. ✅ `pages/api/programs.ts` - Dynamic imports
2. ✅ `pages/api/programs-ai.ts` - Dynamic imports
3. ✅ `next.config.js` - Webpack TypeScript support
4. ✅ `tsconfig.json` - Already includes scraper-lite/src

## Important: Restart Required

**⚠️ RESTART THE DEV SERVER** - Webpack config changes require a restart!

