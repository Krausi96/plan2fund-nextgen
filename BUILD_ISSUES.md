# Build Issues (Pre-existing)

## Current Status
- ✅ **TypeScript Check:** PASSED (`npx tsc --noEmit`)
- ❌ **Next.js Build:** FAILED (pre-existing issues)

## Issues Found

### 1. Global CSS Import Location
**Error:** Global CSS cannot be imported from `pages/main/_app.tsx`  
**Location:** `pages/main/_app.tsx:1`  
**Fix:** Move global CSS import to root `pages/_app.tsx` or use CSS Modules

### 2. PostgreSQL Module in Client Code
**Error:** Module not found: Can't resolve 'dns'  
**Location:** `shared/lib/templates/templateVersioning.ts` imports `pg`  
**Issue:** `pg` is a server-side only module, but it's being bundled for client  
**Fix:** Ensure `templateVersioning.ts` is only imported in server-side code (API routes)

### 3. Nested Reserved Page
**Warning:** `pages/main/_app.tsx` is nested (should be directly under `pages/`)  
**Location:** `pages/main/_app.tsx`  
**Fix:** Move to `pages/_app.tsx` or restructure

## Notes
- These issues existed before the current changes
- TypeScript compilation is successful
- All new code passes TypeScript checks
- Build issues are architectural and need separate fixes

## Recommended Fixes
1. Move `pages/main/_app.tsx` → `pages/_app.tsx`
2. Ensure `templateVersioning.ts` is only used in API routes
3. Use dynamic imports with `typeof window === 'undefined'` checks for server-only code

