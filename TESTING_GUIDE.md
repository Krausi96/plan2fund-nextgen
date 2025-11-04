# Testing Guide - Authentication System

**Date:** 2025-01-27  
**Status:** User created in database - Ready for comprehensive testing

---

## 🎯 What to Test

Now that you have a user in the database, here's a comprehensive testing checklist:

---

## 1. Authentication Flow Tests

### ✅ Test 1.1: User Registration (New Account)
**Test:** Create a new user account

**Steps:**
1. Go to `http://localhost:3000/login`
2. Click "Sign up" (or toggle to signup mode)
3. Enter:
   - Email: `test@example.com` (use a new email)
   - Password: `testpassword123` (min 8 chars)
   - Name: `Test User` (optional)
4. Click "Create Account"

**Expected Results:**
- ✅ User account created in database
- ✅ Redirected to `/dashboard`
- ✅ Welcome email sent (if email configured)
- ✅ Session cookie set (`pf_session`)
- ✅ User data displayed in dashboard header

**Database Check:**
```sql
-- Run in Neon SQL Editor
SELECT id, email, name, segment, created_at, email_verified 
FROM users 
WHERE email = 'test@example.com';
```

**Verify:**
- User exists in `users` table
- `password_hash` is NOT plaintext (should be bcrypt hash)
- `segment` defaults to 'B2C_FOUNDER'
- `created_at` timestamp is set
- `email_verified` is `false` (default)

---

### ✅ Test 1.2: User Login (Existing Account)
**Test:** Login with the user you just created

**Steps:**
1. Logout (if logged in)
2. Go to `http://localhost:3000/login`
3. Enter:
   - Email: `test@example.com`
   - Password: `testpassword123`
4. Click "Sign In"

**Expected Results:**
- ✅ Login successful
- ✅ Redirected to `/dashboard`
- ✅ Session cookie set
- ✅ User profile loaded in dashboard
- ✅ No password hash in response (security check)

**Check Session:**
```sql
-- Check session was created
SELECT id, user_id, token, expires_at, created_at 
FROM user_sessions 
WHERE user_id = (SELECT id FROM users WHERE email = 'test@example.com')
ORDER BY created_at DESC 
LIMIT 1;
```

---

### ✅ Test 1.3: Session Persistence
**Test:** Verify session persists across page refreshes

**Steps:**
1. While logged in, refresh the page (`F5`)
2. Navigate to different pages
3. Close and reopen browser tab (don't close browser)

**Expected Results:**
- ✅ User stays logged in
- ✅ Dashboard shows user data
- ✅ No redirect to login page
- ✅ Session cookie still present

**API Test:**
```bash
# Test session endpoint (replace with your session token)
curl http://localhost:3000/api/auth/session \
  -H "Cookie: pf_session=YOUR_SESSION_TOKEN"
```

**Expected Response:**
```json
{
  "success": true,
  "user": {
    "id": 1,
    "email": "test@example.com",
    "name": "Test User",
    ...
  }
}
```

---

### ✅ Test 1.4: Logout
**Test:** Properly logout and clear session

**Steps:**
1. Click "Log out" (or call `/api/auth/logout`)
2. Try to access `/dashboard`

**Expected Results:**
- ✅ Session cookie cleared
- ✅ Redirected to login page
- ✅ Session deleted from database
- ✅ Cannot access protected pages

**Database Check:**
```sql
-- Session should be deleted
SELECT COUNT(*) FROM user_sessions 
WHERE token = 'YOUR_SESSION_TOKEN';
-- Should return 0
```

---

## 2. Error Handling Tests

### ✅ Test 2.1: Duplicate Registration
**Test:** Try to register with existing email

**Steps:**
1. Try to register with `test@example.com` again
2. Use different password

**Expected Results:**
- ✅ Error: "User with this email already exists"
- ✅ HTTP 409 status code
- ✅ No new user created

---

### ✅ Test 2.2: Invalid Login Credentials
**Test:** Login with wrong password

**Steps:**
1. Try to login with correct email but wrong password

**Expected Results:**
- ✅ Error: "Invalid email or password"
- ✅ HTTP 401 status code
- ✅ No session created
- ✅ User stays on login page

---

### ✅ Test 2.3: Missing Required Fields
**Test:** Register/Login without required fields

**Steps:**
1. Try to register without email
2. Try to register without password
3. Try to login without password

**Expected Results:**
- ✅ Validation errors shown
- ✅ HTTP 400 status code
- ✅ Clear error messages

---

### ✅ Test 2.4: Invalid Session Token
**Test:** Access protected route with invalid/expired session

**Steps:**
1. Manually set invalid cookie: `pf_session=invalid_token`
2. Try to access `/dashboard`
3. Try to call `/api/auth/session`

**Expected Results:**
- ✅ Redirected to login
- ✅ HTTP 401 error
- ✅ Clear error message

---

## 3. Email Functionality Tests

### ✅ Test 3.1: Welcome Email (On Registration)
**Test:** Verify welcome email is sent after registration

**Steps:**
1. Register a new user
2. Check email inbox (if `RESEND_API_KEY` is configured)

**Expected Results:**
- ✅ Welcome email sent to user's email
- ✅ Email contains welcome message
- ✅ Email has proper styling

**Manual Test:**
- Go to `http://localhost:3000/test-email`
- Select "Welcome Email"
- Enter your email
- Click "Send Test Email"

---

### ✅ Test 3.2: Email Service Configuration
**Test:** Verify email service is properly configured

**Check `.env.local`:**
```env
RESEND_API_KEY=re_xxxxxxxxxxxxx
```

**Test Email API:**
```bash
curl -X POST http://localhost:3000/api/test-email \
  -H "Content-Type: application/json" \
  -d '{
    "email": "your-email@example.com",
    "type": "welcome"
  }'
```

**Expected Results:**
- ✅ Email sent successfully
- ✅ Response: `{ "success": true, "message": "..." }`
- ✅ Email received in inbox

---

## 4. Database Integration Tests

### ✅ Test 4.1: User Data in Database
**Test:** Verify user data is correctly stored

**SQL Query:**
```sql
-- Check user record
SELECT 
  id, 
  email, 
  name, 
  segment,
  program_type,
  industry,
  language,
  payer_type,
  experience,
  gdpr_consent,
  email_verified,
  created_at,
  last_active_at
FROM users 
WHERE email = 'test@example.com';
```

**Expected Results:**
- ✅ All fields populated correctly
- ✅ `password_hash` is NOT plaintext
- ✅ `created_at` and `last_active_at` are timestamps
- ✅ Default values match schema

---

### ✅ Test 4.2: Session Management
**Test:** Verify sessions are properly managed

**SQL Query:**
```sql
-- Check active sessions
SELECT 
  s.id,
  s.user_id,
  s.token,
  s.expires_at,
  s.ip_address,
  s.user_agent,
  s.created_at,
  u.email
FROM user_sessions s
JOIN users u ON s.user_id = u.id
WHERE u.email = 'test@example.com'
ORDER BY s.created_at DESC;
```

**Expected Results:**
- ✅ Sessions created on login
- ✅ Sessions deleted on logout
- ✅ `expires_at` is 30 days from creation
- ✅ IP address and user agent stored

---

### ✅ Test 4.3: Password Security
**Test:** Verify passwords are properly hashed

**SQL Query:**
```sql
-- Check password hash (should NOT be plaintext)
SELECT 
  email,
  password_hash,
  LENGTH(password_hash) as hash_length
FROM users 
WHERE email = 'test@example.com';
```

**Expected Results:**
- ✅ `password_hash` is bcrypt hash (starts with `$2a$` or `$2b$`)
- ✅ Hash length is 60 characters
- ✅ Original password NOT stored

---

## 5. Dashboard Integration Tests

### ✅ Test 5.1: Protected Routes
**Test:** Verify dashboard requires authentication

**Steps:**
1. Logout
2. Try to access `http://localhost:3000/dashboard` directly
3. Try to access other protected pages

**Expected Results:**
- ✅ Redirected to `/login`
- ✅ Cannot access without session
- ✅ `withAuth` HOC working correctly

---

### ✅ Test 5.2: User Profile Display
**Test:** Verify user data displays correctly

**Steps:**
1. Login
2. Go to dashboard
3. Check header section

**Expected Results:**
- ✅ Welcome message shows user segment
- ✅ User email/profile info available
- ✅ Stats cards load correctly
- ✅ No errors in console

---

### ✅ Test 5.3: Session Refresh
**Test:** Verify session stays valid across requests

**Steps:**
1. Login
2. Wait a few minutes
3. Navigate between pages
4. Make API calls

**Expected Results:**
- ✅ Session remains valid
- ✅ No unexpected logouts
- ✅ User data persists

---

## 6. API Endpoint Tests

### ✅ Test 6.1: Registration API
```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "newuser@example.com",
    "password": "securepass123",
    "name": "New User"
  }'
```

**Expected Response:**
```json
{
  "success": true,
  "user": {
    "id": 2,
    "email": "newuser@example.com",
    "name": "New User",
    "segment": "B2C_FOUNDER",
    ...
  },
  "sessionToken": "..."
}
```

---

### ✅ Test 6.2: Login API
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "testpassword123"
  }'
```

**Expected Response:**
```json
{
  "success": true,
  "user": { ... },
  "sessionToken": "..."
}
```

**Check Cookie:**
- Response should include `Set-Cookie` header
- Cookie name: `pf_session`
- Cookie flags: `HttpOnly`, `Secure`, `SameSite=Strict`

---

### ✅ Test 6.3: Session API
```bash
curl http://localhost:3000/api/auth/session \
  -H "Cookie: pf_session=YOUR_SESSION_TOKEN"
```

**Expected Response:**
```json
{
  "success": true,
  "user": { ... }
}
```

---

### ✅ Test 6.4: Logout API
```bash
curl -X POST http://localhost:3000/api/auth/logout \
  -H "Cookie: pf_session=YOUR_SESSION_TOKEN"
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Logged out successfully"
}
```

---

## 7. Edge Cases & Security Tests

### ✅ Test 7.1: SQL Injection Prevention
**Test:** Try SQL injection in email field

**Steps:**
1. Try to register with email: `test'; DROP TABLE users; --`
2. Try to login with malicious email

**Expected Results:**
- ✅ No SQL errors
- ✅ Input sanitized
- ✅ Database safe

---

### ✅ Test 7.2: XSS Prevention
**Test:** Try XSS in name field

**Steps:**
1. Register with name: `<script>alert('xss')</script>`

**Expected Results:**
- ✅ Script not executed
- ✅ Name displayed as text (not HTML)
- ✅ Input sanitized

---

### ✅ Test 7.3: Password Strength
**Test:** Try weak passwords

**Steps:**
1. Try password: `123` (too short)
2. Try password: `password` (common)

**Expected Results:**
- ✅ Minimum length enforced (8 chars)
- ✅ Clear validation messages

---

### ✅ Test 7.4: Session Expiration
**Test:** Verify expired sessions are rejected

**Steps:**
1. Manually expire session in database:
```sql
UPDATE user_sessions 
SET expires_at = NOW() - INTERVAL '1 day'
WHERE token = 'YOUR_SESSION_TOKEN';
```
2. Try to access dashboard

**Expected Results:**
- ✅ Session rejected
- ✅ Redirected to login
- ✅ Clear error message

---

## 8. Browser Console Tests

### ✅ Test 8.1: Check for Errors
**Steps:**
1. Open browser DevTools (F12)
2. Go to Console tab
3. Perform login/registration
4. Check for errors

**Expected Results:**
- ✅ No JavaScript errors
- ✅ No network errors
- ✅ Clean console

---

### ✅ Test 8.2: Check Network Requests
**Steps:**
1. Open Network tab
2. Perform login
3. Check API requests

**Expected Results:**
- ✅ `/api/auth/login` returns 200
- ✅ No CORS errors
- ✅ Cookies set correctly
- ✅ Response time reasonable (< 1s)

---

## 9. Performance Tests

### ✅ Test 9.1: Response Times
**Test:** Verify API response times

**Expected Results:**
- ✅ Registration: < 500ms
- ✅ Login: < 500ms
- ✅ Session check: < 200ms
- ✅ Logout: < 200ms

---

### ✅ Test 9.2: Concurrent Requests
**Test:** Multiple users logging in simultaneously

**Steps:**
1. Open multiple browser tabs
2. Login different users
3. Check for race conditions

**Expected Results:**
- ✅ No database deadlocks
- ✅ All requests succeed
- ✅ Sessions unique per user

---

## 10. Integration Tests

### ✅ Test 10.1: Full User Journey
**Test:** Complete user flow from registration to dashboard

**Steps:**
1. Register new user
2. Receive welcome email
3. Login
4. Access dashboard
5. Create a plan (if applicable)
6. Logout
7. Login again
8. Verify data persisted

**Expected Results:**
- ✅ All steps work smoothly
- ✅ No data loss
- ✅ User experience is smooth

---

## 📋 Quick Test Checklist

- [ ] User registration works
- [ ] User login works
- [ ] Session persists across refreshes
- [ ] Logout clears session
- [ ] Duplicate registration blocked
- [ ] Invalid credentials rejected
- [ ] Welcome email sent
- [ ] User data in database correct
- [ ] Password hashed (not plaintext)
- [ ] Dashboard protected (requires login)
- [ ] Session API works
- [ ] No JavaScript errors
- [ ] No SQL injection possible
- [ ] Performance acceptable

---

## 🐛 Common Issues & Solutions

### Issue: "Database connection failed"
**Solution:**
- Check `DATABASE_URL` in `.env.local`
- Verify Neon database is running
- Test connection: `psql $DATABASE_URL`

### Issue: "Email not sending"
**Solution:**
- Check `RESEND_API_KEY` in `.env.local`
- Verify API key is valid
- Check Resend dashboard for errors
- Test with `/test-email` page

### Issue: "Session not persisting"
**Solution:**
- Check cookie settings (HttpOnly, Secure, SameSite)
- Verify cookie domain/path
- Check browser settings (cookies enabled)
- Verify session in database

### Issue: "Password hash not working"
**Solution:**
- Verify bcrypt is installed: `npm list bcryptjs`
- Check password hashing in `user-repository.ts`
- Ensure password is hashed before storing

---

## 📝 Test Results Template

```
Date: ___________
Tester: ___________

✅ Registration: PASS / FAIL
✅ Login: PASS / FAIL
✅ Session: PASS / FAIL
✅ Logout: PASS / FAIL
✅ Email: PASS / FAIL
✅ Database: PASS / FAIL
✅ Security: PASS / FAIL
✅ Performance: PASS / FAIL

Notes:
_________________________________
_________________________________
_________________________________
```

---

## 🚀 Next Steps After Testing

Once all tests pass:

1. **Email Testing** - Complete email functionality testing
2. **Dashboard Polish** - Continue UI improvements (already done!)
3. **Data Migration** - Migrate localStorage data to database
4. **OAuth Integration** - Implement Google/GitHub login
5. **Password Reset** - Add forgot password functionality
6. **Email Verification** - Add email verification flow

---

**Good luck with testing! 🎉**

