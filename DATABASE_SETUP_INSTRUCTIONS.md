# Database Setup - Next Steps

## ✅ What's Been Created

1. **Database Schema** (`shared/db/schema.sql`)
   - Users table with password hashing
   - OAuth providers table for social login
   - User sessions table for secure sessions
   - User plans table (migrates from localStorage)
   - User recommendations table (migrates from localStorage)

2. **API Endpoints**
   - `/api/auth/register` - Create new user
   - `/api/auth/login` - Login with password
   - `/api/auth/session` - Get current user
   - `/api/auth/logout` - Logout
   - `/api/db/setup` - Run schema (one-time setup)

3. **User Repository** (`shared/db/user-repository.ts`)
   - Database operations for users
   - Password hashing with bcrypt
   - Session management

## 🚀 Step-by-Step Setup

### Step 1: Run Database Schema

**Option A: Using Neon SQL Editor (Recommended)**
1. Go to your Neon dashboard
2. Open SQL Editor
3. Copy contents of `shared/db/schema.sql`
4. Paste and execute

**Option B: Using API Endpoint**
```bash
# Visit in browser (only works in development)
http://localhost:3000/api/db/setup
```

**Option C: Using psql**
```bash
psql $DATABASE_URL -f shared/db/schema.sql
```

### Step 2: Verify Connection

Your `.env.local` should have:
```
DATABASE_URL=postgresql://user:pass@host.neon.tech/dbname
```

Test it:
```bash
# In browser console or API route
fetch('/api/auth/session').then(r => r.json()).then(console.log)
```

### Step 3: Test Registration

1. Open your app
2. Click "Log in" in header
3. Click "Sign up"
4. Enter email and password (min 8 chars)
5. Should create user in database

### Step 4: Migration (Optional)

If you have existing users in localStorage, you can migrate them:
- They'll need to sign up again with password
- Or use the migration script in `scripts/migrate-to-database.ts`

## 📊 Data Storage

**Before (localStorage):**
- `pf_user_profile` → Now in `users` table
- `userPlans` → Now in `user_plans` table  
- `userRecommendations` → Now in `user_recommendations` table

**After (Database):**
- All data in PostgreSQL
- Password hashed with bcrypt
- Sessions in database with expiration
- Can query across users
- Supports multi-device access

## 🔐 Security Features

- ✅ Password hashing (bcrypt, 10 rounds)
- ✅ Session tokens (32-byte random)
- ✅ HTTP-only cookies
- ✅ Session expiration (30 days)
- ✅ SQL injection protection (parameterized queries)

## 🎯 Next Steps After Setup

1. **Run schema** - Execute `shared/db/schema.sql` in Neon
2. **Test registration** - Try creating a new account
3. **Test login** - Login with email/password
4. **Check database** - Verify user appears in `users` table

## 📝 Notes

- Existing localStorage users need to sign up again
- Social login buttons are UI-ready (OAuth integration pending)
- All passwords are hashed before storage
- Sessions are stored in database with expiration

