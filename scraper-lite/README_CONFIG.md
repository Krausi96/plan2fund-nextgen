# Institution Config Status

## ✅ Current Setup

### Active Config (Used by Scraper)
- **File:** `legacy/institutionConfig.ts`
- **Used by:** `scraper-lite/src/config.ts`
- **Status:** ✅ **ACTIVE - DO NOT CHANGE LOCATION**
- **Only uses institutions with `autoDiscovery: true`**

### Other Config Files
- **`shared/lib/institutionConfig.ts`** - Exists but NOT used by scraper-lite
  - May be used by frontend components
  - **Recommendation:** Keep both files (different purposes)

## ✅ Conclusion

**NO CHANGES NEEDED:**
- Scraper uses `legacy/institutionConfig.ts` ✅
- Config is already set up correctly
- Both files can coexist (different purposes)

**To add institutions:**
- Edit `legacy/institutionConfig.ts` only
- Set `autoDiscovery: true`

