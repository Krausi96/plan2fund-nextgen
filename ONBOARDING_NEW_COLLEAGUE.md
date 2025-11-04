# Onboarding Guide - New Colleague

**Date:** 2025-01-27  
**Status:** Database authentication setup complete, email testing in progress

---

## 🎯 What We're Building

**Plan2Fund** - A platform that helps founders find funding programs and create business plans. Key features:
- **Smart Wizard** - Dynamic questionnaire to find matching funding programs
- **Recommendation Engine** - AI-powered program matching based on user answers
- **Business Plan Builder** - Interactive editor for creating funding applications
- **User Dashboard** - Personalized dashboard showing plans, recommendations, and progress

---

## ✅ What's Been Done Recently

### 1. Database Authentication System (Just Completed)

**What was implemented:**
- ✅ **PostgreSQL Database** (Neon) - Replaced localStorage with real database
- ✅ **Password Authentication** - Secure login with bcrypt hashing
- ✅ **Session Management** - Secure session tokens stored in database
- ✅ **API Endpoints** - `/api/auth/register`, `/api/auth/login`, `/api/auth/session`, `/api/auth/logout`
- ✅ **Login Modal** - Modern popup UI with email/password + social login buttons (UI ready)
- ✅ **User Repository** - Database operations for users (`shared/db/user-repository.ts`)

**Files Created:**
- `shared/db/schema.sql` - Database schema (users, sessions, oauth, plans, recommendations)
- `shared/db/user-repository.ts` - Database operations
- `pages/api/auth/*` - Authentication endpoints
- `shared/components/auth/LoginModal.tsx` - Login/signup modal
- `shared/lib/auth-utils.ts` - Session token utilities

**Files Cleaned Up:**
- ❌ Removed duplicate `/api/database/users.ts` (old mock)
- ✅ Updated `/api/user/profile.ts` to use database
- ✅ Updated `UserContext.tsx` to use new auth endpoints
- ✅ Protected test email endpoints (dev-only)

---

## 🚧 Current Status & Next Steps

### **Step 1: Email Testing (IN PROGRESS - Wait for this)**

**What's happening:**
- Testing email functionality (welcome emails, payment receipts, etc.)
- Verifying `RESEND_API_KEY` configuration
- Testing email templates in `shared/lib/emailService.ts`

**What you should do:**
- ⏸️ **WAIT** - Don't start dashboard UI work yet
- Once email testing is complete, we'll move to Step 2

**Email Files:**
- `shared/lib/emailService.ts` - Main email service (Resend API)
- `pages/api/test-email.ts` - Test endpoint (dev-only)
- `pages/test-email.tsx` - Test UI page (dev-only)

---

### **Step 2: Dashboard UI Polish (Your Task - After Email Works)**

**What needs to be done:**
Polish and improve the dashboard UI/UX at `/dashboard`

**Current Dashboard Location:**
- `pages/dashboard.tsx` - Main dashboard page
- Uses `withAuth` HOC for protection (requires login)

**What to improve:**
1. **Visual Design**
   - Modern, clean layout
   - Better spacing and typography
   - Consistent color scheme
   - Responsive design (mobile-friendly)
   - Better card designs and hover effects

2. **User Experience**
   - Clear navigation
   - Better data visualization (charts, progress indicators)
   - Loading states (skeleton loaders)
   - Empty states (when no plans/recommendations)
   - Error handling UI
   - Smooth transitions and animations

3. **Sections to Polish:**
   - **Stats Cards** - Better visual representation of numbers
   - **Business Plans List** - Improve card design, status badges, actions
   - **Funding Recommendations** - Better program cards, status indicators
   - **Recent Activity** - Timeline or activity feed design
   - **Documents Section** - Better file previews, download buttons
   - **Payment History** - Cleaner transaction list
   - **Admin Panel** - If visible, improve admin UI
   - **Client Manager** - For multi-user workspaces

**Current Dashboard Features:**
- User profile display
- Stats overview (plans, recommendations, payments)
- Business plans list with status filters
- Funding recommendations
- Payment history
- Documents list
- Client workspace manager (for consultants)
- Admin user management panel

**Dashboard Data:**
- User data from database (`users` table)
- Plans from `user_plans` table (or localStorage fallback)
- Recommendations from `user_recommendations` table (or localStorage fallback)

**Tools Available:**
- Tailwind CSS - Already configured
- Lucide React icons - Icon library
- Existing UI components in `shared/components/ui/`

---

## 📁 Project Structure

```
plan2fund-nextgen/
├── pages/
│   ├── dashboard.tsx          ← YOUR TASK: Polish UI here
│   ├── login.tsx              ← Login page (modal popup)
│   ├── reco.tsx                ← Smart Wizard
│   └── api/
│       ├── auth/              ← Auth endpoints (register, login, session, logout)
│       ├── recommend.ts        ← Recommendation engine
│       └── programs.ts         ← Funding programs data
│
├── shared/
│   ├── components/
│   │   ├── auth/
│   │   │   └── LoginModal.tsx ← Login modal component
│   │   └── ui/                ← Reusable UI components (button, card, input, etc.)
│   ├── contexts/
│   │   └── UserContext.tsx    ← User authentication context
│   ├── db/
│   │   ├── schema.sql         ← Database schema
│   │   └── user-repository.ts ← Database operations
│   └── lib/
│       ├── emailService.ts     ← Email service (Resend)
│       └── auth-utils.ts       ← Auth utilities
│
└── features/
    └── reco/                  ← Recommendation engine & wizard
```

---

## 🔧 Development Setup

### Prerequisites
- Node.js (v18+)
- PostgreSQL (Neon database)
- `.env.local` with:
  ```
  DATABASE_URL=postgresql://user:pass@host.neon.tech/dbname
  RESEND_API_KEY=re_xxxxxxxxxxxxx (optional for now)
  ```

### Run Development Server
```bash
npm install
npm run dev
```

### Database Setup
1. Run schema in Neon: Copy `shared/db/schema.sql` to Neon SQL Editor
2. Verify connection: Test login/registration

### Testing
- Login: `http://localhost:3000/login`
- Dashboard: `http://localhost:3000/dashboard`
- Test Email: `http://localhost:3000/test-email` (dev-only)

---

## 🎨 Design Guidelines

### Colors (Tailwind)
- Primary: Blue (`blue-600`, `blue-700`)
- Success: Green (`green-600`)
- Warning: Yellow (`yellow-600`)
- Error: Red (`red-600`)
- Neutral: Gray scale

### Typography
- Headings: Bold, clear hierarchy
- Body: Readable, good line-height
- Code/Monospace: For technical data

### Components
- Use existing components from `shared/components/ui/`
- Follow Tailwind utility classes
- Keep responsive (mobile-first)

---

## 📝 Notes

### Authentication
- Users must be logged in to access `/dashboard`
- Session managed via HTTP-only cookies
- User data stored in PostgreSQL

### Data Storage
- **Users**: PostgreSQL `users` table
- **Plans**: `user_plans` table (or localStorage fallback)
- **Recommendations**: `user_recommendations` table (or localStorage fallback)

### Current Limitations
- Social login buttons (Google, GitHub) are UI-only (not implemented yet)
- Some data still uses localStorage as fallback during migration

---

## 🚀 When to Start

**⏸️ WAIT FOR:** Email testing to be completed  
**✅ THEN START:** Dashboard UI polish work

**Questions?** Ask the team lead before starting dashboard work.

---

## 📚 Useful Resources

- **Tailwind CSS Docs**: https://tailwindcss.com/docs
- **Next.js Docs**: https://nextjs.org/docs
- **Lucide Icons**: https://lucide.dev/icons
- **Test Email Guide**: `shared/docs/TEST_EMAIL_GUIDE.md`
- **Database Setup**: `DATABASE_SETUP_INSTRUCTIONS.md`

---

**Good luck! 🎉**

