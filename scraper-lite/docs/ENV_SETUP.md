# 🔧 Environment Variable Setup

## Where to Put DATABASE_URL

**File: `.env.local` (in project root)**

```
# Location: plan2fund-nextgen/.env.local
DATABASE_URL=postgresql://neondb_owner:npg_wxsht89kSYgr@ep-winter-grass-agmbjcan-pooler.c-2.eu-central-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require
```

## Why `.env.local`?

1. ✅ **Next.js automatically loads it** - Your API routes (`pages/api/*`) will automatically have access to `process.env.DATABASE_URL`
2. ✅ **In .gitignore** - Never committed to git (secure)
3. ✅ **Local overrides** - Can have different values for local development vs production

## File Structure

```
plan2fund-nextgen/
├── .env.local          ← PUT DATABASE_URL HERE
├── .gitignore          ← Already includes .env.local
├── pages/
│   └── api/
│       └── programs.ts ← Reads DATABASE_URL automatically
└── scraper-lite/
    └── scripts/        ← Loads from .env.local automatically
```

## Verification

```bash
# Test connection
cd scraper-lite
node scripts/test-neon-connection.js

# Should output: ✅ Connection successful!
```

## Alternative: PowerShell (Temporary)

If you need to set it temporarily in PowerShell:

```powershell
$env:DATABASE_URL="postgresql://neondb_owner:npg_wxsht89kSYgr@ep-winter-grass-agmbjcan-pooler.c-2.eu-central-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require"
```

But **`.env.local` is preferred** - it persists and works for both Next.js and CLI scripts.

