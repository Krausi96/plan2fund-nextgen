# Database Setup Guide

## Step 1: Run the Schema

Run the SQL schema in your Neon database:

```bash
# Option 1: Using psql
psql <your-database-url> -f shared/user/database/schema.sql

# Option 2: Using Neon SQL Editor
# Copy contents of shared/user/database/schema.sql and paste into Neon's SQL editor
```

This creates:
- `users` table - User accounts with password hashing
- `oauth_providers` table - Social login connections
- `user_sessions` table - Secure session management
- `user_plans` table - User's business plans (migrates from localStorage)
- `user_recommendations` table - User's funding recommendations

## Step 2: Verify Connection

Your `.env.local` should have:
```
DATABASE_URL=postgresql://user:pass@host.neon.tech/dbname
```

Test the connection:
```bash
# Test connection
node -e "require('dotenv').config({ path: '.env.local' }); const { testConnection } = require('./scraper-lite/src/db/neon-client.ts'); testConnection().then(r => console.log(r ? '✅ Connected' : '❌ Failed'));"
```

## Step 3: API Endpoints Created

✅ `/api/auth/register` - Create new user account
✅ `/api/auth/login` - Login with email/password
✅ `/api/auth/session` - Get current user session
✅ `/api/auth/logout` - Logout and clear session

## Step 4: What Changed

- **LoginModal** now calls `/api/auth/register` or `/api/auth/login`
- **Password hashing** with bcrypt (10 rounds)
- **Session tokens** stored in database with expiration
- **HTTP-only cookies** for secure session management

## Step 5: Migration from localStorage

Existing users in localStorage will need to:
1. Sign up again with email/password (or login if email matches)
2. Data will be migrated automatically when they save plans/recommendations

## Next Steps

1. **Run schema** in your database
2. **Test login** - try registering a new user
3. **Migrate existing data** - optional script to move localStorage data to database

