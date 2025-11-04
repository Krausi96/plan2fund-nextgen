# User Authentication & Dashboard Wiring Analysis

**Date:** 2025-01-27  
**Goal:** Identify all user-related files and recommend how to wire login/dashboard to the workflow

---

## 📁 **USER-RELATED FILES IDENTIFIED**

### **Core Authentication Files**
1. **`pages/login.tsx`** ✅
   - Login form with email, name, segment selection
   - Sets user profile via `setUserProfile()` from UserContext
   - Redirects to `/dashboard` after login
   - **Status:** Working but not integrated with workflow

2. **`pages/dashboard.tsx`** ✅
   - Shows user plans, recommendations, stats
   - Loads data from localStorage (`userPlans`, `userRecommendations`)
   - Has admin panel (for specific admin users)
   - Links to workflow pages (`/reco`, `/editor`)
   - **Status:** Functional but not protected; no auth check

3. **`shared/contexts/UserContext.tsx`** ✅
   - Provides `userProfile`, `isLoading`, `hasCompletedOnboarding`
   - Methods: `setUserProfile()`, `clearUserProfile()`, `refreshProfile()`
   - Loads profile from localStorage on mount
   - **Status:** Working correctly

4. **`shared/lib/schemas/userProfile.ts`** ✅
   - UserProfile interface and validation
   - **Status:** Complete

5. **`pages/api/user/profile.ts`** ✅
   - API endpoints for user profile (GET, POST, PUT, DELETE)
   - Currently mocked (database TODO)
   - **Status:** Functional but needs backend integration

### **UI Components**
6. **`shared/components/layout/Header.tsx`** ✅
   - Shows "Log in" button when no user
   - Shows "My Account" link when user is logged in
   - **Status:** Working but missing logout functionality

7. **`shared/components/layout/AppShell.tsx`** ✅
   - Wraps all pages with Header/Footer
   - **Status:** No auth protection

### **Multi-User Data Management**
8. **`shared/lib/multiUserDataManager.ts`** ✅
   - Manages multiple client workspaces (consultants managing multiple clients)
   - Methods: `listClients()`, `saveClient()`, `assignPlanToClient()`
   - Stores clients in `localStorage.pf_clients`
   - Associates plans with `clientId` in `localStorage.userPlans`
   - **Status:** Working, used by dashboard for client switching
   - **Integration:** Dashboard uses this to filter plans by client

### **Analytics & Tracking**
9. **`shared/lib/analytics.ts`** ✅
   - Comprehensive analytics implementation
   - Tracks user actions, page views, conversions
   - Sets `userId` via `setUserId()` - called from UserContext
   - Generates and stores `sessionId` in `localStorage.pf_session_id`
   - Sends events to `/api/analytics/track` and Google Analytics
   - Tracks: wizard start/complete, editor actions, onboarding, errors, GDPR actions
   - **Status:** Fully functional, already integrated with UserContext
   - **Integration:** UserContext calls `analytics.setUserId()` on login

10. **`pages/api/analytics/track.ts`** ✅
    - API endpoint for tracking analytics events
    - Receives events from frontend
    - **Status:** Working

### **Target Group Detection**
11. **`features/intake/engine/targetGroupDetection.ts`** ✅
    - Detects user target group: `startups`, `sme`, `advisors`, `universities`, `default`
    - Detection sources: URL path, UTM parameters, query params, referrer, localStorage
    - Stores selection in `localStorage.selectedTargetGroup`
    - Used for personalizing content/features
    - **Status:** Working, used on home page
    - **Integration:** Home page uses this to customize content

12. **`shared/components/common/TargetGroupBanner.tsx`** ✅
    - UI banner for target group selection
    - Shows when no target group detected
    - Stores selection and calls `onTargetGroupSelect` callback
    - **Status:** Working

### **Feature Flags**
13. **`shared/lib/featureFlags.ts`** ✅
    - Feature flag system based on user segment
    - Methods: `setUserContext(segment, userId)`, `isEnabled(flagName)`, `getExperimentVariant()`
    - Stores flags in `localStorage.pf_feature_flags`
    - Uses user segment and userId for consistent feature/experiment assignment
    - **Status:** Working, already integrated with UserContext
    - **Integration:** UserContext calls `featureFlags.setUserContext()` on login

### **GDPR Compliance**
14. **`pages/api/gdpr/delete-data.ts`** ✅
    - GDPR data deletion endpoint
    - Tracks deletion requests via analytics
    - Currently mocked (database TODO)
    - **Status:** Functional but needs backend integration

15. **`pages/privacy-settings.tsx`** ✅
    - Privacy settings page (referenced in localStorage usage)
    - **Status:** Exists (needs verification of implementation)

### **Session Management**
16. **`pages/_app.tsx`** ✅
    - Sets session cookie `pf_session` on app initialization
    - Wraps app with `UserProvider`, `I18nProvider`, `RecommendationProvider`
    - **Status:** Working

---

## 🔄 **CURRENT WORKFLOW**

### **User Journey (Intended)**
1. **Home** (`/`) → User browses, can click CTA to start
2. **Login** (`/login`) → User logs in (optional? or required?)
3. **Recommendations Wizard** (`/reco`) → User answers questions
4. **Results** (`/results`) → Shows matching programs
5. **Editor** (`/editor`) → User creates business plan
6. **Preview** (`/preview`) → Review plan
7. **Export/Checkout** (`/export`, `/checkout`) → Purchase/download
8. **Dashboard** (`/dashboard`) → View all plans, recommendations

### **Current State**
- ✅ Login page exists and works
- ✅ Dashboard exists and displays data
- ✅ UserContext provides user state
- ❌ **No route protection** - Users can access all pages without login
- ❌ **No redirect logic** - Unauthenticated users not redirected to login
- ❌ **No logout** - Header doesn't have logout button
- ❌ **Dashboard not integrated** - Workflow pages don't check auth

---

## ❌ **MISSING CONNECTIONS**

### **1. Route Protection (CRITICAL)**
**Problem:** Workflow pages (`/reco`, `/editor`, `/results`, `/preview`, `/export`, `/checkout`, `/dashboard`) can be accessed without authentication.

**Impact:** 
- Users can use the app without logging in
- Dashboard shows empty state for unauthenticated users
- Data not associated with user accounts

**Files Affected:**
- `pages/reco.tsx`
- `pages/editor.tsx`
- `pages/results.tsx`
- `pages/preview.tsx`
- `pages/export.tsx`
- `pages/checkout.tsx`
- `pages/dashboard.tsx`

### **2. Redirect Logic (CRITICAL)**
**Problem:** No middleware or HOC to redirect unauthenticated users to `/login`.

**Impact:** Users can access protected pages and see errors or empty states.

**Solution Needed:** Create a `withAuth` HOC or use Next.js middleware.

### **3. Logout Functionality (HIGH)**
**Problem:** Header shows "My Account" but no way to logout.

**Impact:** Users can't log out once logged in.

**Files Affected:**
- `shared/components/layout/Header.tsx`

### **4. Post-Login Redirect (MEDIUM)**
**Problem:** After login, always redirects to `/dashboard`, but user might have been trying to access a specific page.

**Impact:** Poor UX - user loses their intended destination.

**Files Affected:**
- `pages/login.tsx`

### **5. Dashboard Data Integration (MEDIUM)**
**Problem:** Dashboard reads from localStorage (`userPlans`, `userRecommendations`) but workflow pages don't save data there consistently.

**Impact:** Dashboard might not show all user data.

**Files Affected:**
- `pages/dashboard.tsx`
- `pages/editor.tsx` (should save plans)
- `pages/results.tsx` (should save recommendations)

### **6. Multi-User Data Integration (MEDIUM)**
**Problem:** `multiUserDataManager` exists but may not be fully integrated with workflow pages.

**Impact:** Consultant/advisor users managing multiple clients may not have proper data separation.

**Files Affected:**
- `pages/dashboard.tsx` (already uses it)
- `pages/editor.tsx` (should assign plans to clients)
- `pages/results.tsx` (should associate recommendations with clients)

### **7. Analytics User ID Integration (LOW)**
**Problem:** Analytics is already integrated but should verify all workflow pages track events with user context.

**Impact:** Analytics events may not be properly attributed to users.

**Files Affected:**
- All workflow pages should use `analytics.trackUserAction()` with user context

### **8. Target Group & User Segment Alignment (LOW)**
**Problem:** Target group detection (startups, sme, advisors, universities) may not align with user segment (B2C_FOUNDER, SME_LOAN, VISA, PARTNER).

**Impact:** User experience might not be personalized correctly.

**Files Affected:**
- `pages/login.tsx` (segment selection)
- `features/intake/engine/targetGroupDetection.ts` (target group detection)
- **Note:** These serve different purposes - target group is for marketing, segment is for user type

---

## ✅ **RECOMMENDATIONS**

### **Priority 1: Route Protection (CRITICAL)**

#### **Option A: Create `withAuth` HOC (Recommended)**
Create a Higher Order Component to protect routes:

**File:** `shared/lib/withAuth.tsx`
```typescript
import { useEffect } from 'react';
import { useRouter } from 'next/router';
import { useUser } from '@/shared/contexts/UserContext';

export function withAuth<P extends object>(Component: React.ComponentType<P>) {
  return function AuthenticatedComponent(props: P) {
    const { userProfile, isLoading } = useUser();
    const router = useRouter();

    useEffect(() => {
      if (!isLoading && !userProfile) {
        // Save intended destination
        router.replace(`/login?redirect=${encodeURIComponent(router.asPath)}`);
      }
    }, [userProfile, isLoading, router]);

    if (isLoading) {
      return <div>Loading...</div>;
    }

    if (!userProfile) {
      return null; // Will redirect
    }

    return <Component {...props} />;
  };
}
```

**Usage in protected pages:**
```typescript
// pages/dashboard.tsx
export default withAuth(DashboardPage);

// pages/editor.tsx
export default withAuth(EditorPage);
```

#### **Option B: Next.js Middleware (Alternative)**
Create `middleware.ts` in root:
```typescript
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const protectedPaths = ['/dashboard', '/editor', '/reco', '/results', '/preview', '/export', '/checkout'];
  const pathname = request.nextUrl.pathname;
  
  if (protectedPaths.some(path => pathname.startsWith(path))) {
    // Check for auth cookie or session
    const session = request.cookies.get('pf_session');
    if (!session) {
      return NextResponse.redirect(new URL(`/login?redirect=${pathname}`, request.url));
    }
  }
  
  return NextResponse.next();
}
```

### **Priority 2: Update Login Page (HIGH)**

**File:** `pages/login.tsx`

**Changes:**
1. Read `redirect` query parameter
2. After login, redirect to intended destination or dashboard
3. Save user profile to API (optional, currently mocked)

```typescript
const router = useRouter();
const { redirect } = router.query;

// After successful login:
router.replace(redirect ? decodeURIComponent(redirect as string) : '/dashboard');
```

### **Priority 3: Add Logout to Header (HIGH)**

**File:** `shared/components/layout/Header.tsx`

**Changes:**
1. Add logout button/dropdown when user is logged in
2. Call `clearUserProfile()` from UserContext
3. Redirect to home page

```typescript
const { userProfile, clearUserProfile } = useUser();

const handleLogout = () => {
  clearUserProfile();
  router.push('/');
};
```

### **Priority 4: Dashboard Integration (MEDIUM)**

**Files:** `pages/editor.tsx`, `pages/results.tsx`

**Changes:**
1. Save plans to localStorage when created/updated
2. Save recommendations when user selects them
3. Associate with `userProfile.id`

**Example:**
```typescript
// In editor, after saving a plan:
const plans = JSON.parse(localStorage.getItem('userPlans') || '[]');
const newPlan = {
  id: planId,
  userId: userProfile.id,
  title: planTitle,
  status: 'in_progress',
  // ...
};
localStorage.setItem('userPlans', JSON.stringify([...plans, newPlan]));
```

### **Priority 5: Multi-User Data Integration (MEDIUM)**

**Files:** `pages/editor.tsx`, `pages/results.tsx`

**Changes:**
1. When saving plans, use `multiUserDataManager.assignPlanToClient()` if client context exists
2. Ensure plans are associated with both `userId` and `clientId` when applicable
3. Dashboard already filters by client, but ensure editor saves with client context

**Example:**
```typescript
// In editor, after saving a plan:
const { userProfile } = useUser();
const plan = { id: planId, userId: userProfile.id, ... };

// If working in client context (consultant mode)
if (activeClientId) {
  multiUserDataManager.assignPlanToClient(plan, activeClientId);
}
```

### **Priority 6: Analytics Integration Verification (LOW)**

**Files:** All workflow pages

**Changes:**
1. Ensure all user actions are tracked with analytics
2. Verify `analytics.setUserId()` is called from UserContext (already done)
3. Add user context to all analytics events

### **Priority 7: Optional Enhancements**

1. **Login persistence** - Already handled via localStorage ✅
2. **Session expiry** - Add timestamp check
3. **Guest mode** - Allow browsing without login, require login for saving
4. **User profile page** - Settings, account management
5. **Target group sync** - Sync target group selection with user profile (optional)

---

## 🎯 **IMPLEMENTATION PLAN**

### **Step 1: Create Route Protection**
1. Create `shared/lib/withAuth.tsx`
2. Apply to protected pages:
   - `/dashboard`
   - `/editor`
   - `/reco` (optional - could allow guest mode)
   - `/results`
   - `/preview`
   - `/export`
   - `/checkout`

### **Step 2: Update Login Flow**
1. Update `pages/login.tsx` to handle redirect parameter
2. Test redirect after login

### **Step 3: Add Logout**
1. Update `shared/components/layout/Header.tsx`
2. Add logout button/dropdown

### **Step 4: Dashboard Integration**
1. Ensure workflow pages save data to localStorage
2. Associate data with `userProfile.id`
3. Test dashboard shows all user data

### **Step 5: Testing**
1. Test unauthenticated access to protected pages → should redirect
2. Test login → should redirect to intended page
3. Test logout → should clear session
4. Test dashboard → should show user data

---

## 📝 **FILES TO MODIFY**

### **Must Modify:**
1. `pages/login.tsx` - Add redirect handling
2. `shared/components/layout/Header.tsx` - Add logout
3. `pages/dashboard.tsx` - Add auth check (or use withAuth)
4. `pages/editor.tsx` - Add auth check (or use withAuth)
5. `pages/reco.tsx` - Consider auth requirement
6. `pages/results.tsx` - Add auth check (or use withAuth)
7. `pages/preview.tsx` - Add auth check (or use withAuth)
8. `pages/export.tsx` - Add auth check (or use withAuth)
9. `pages/checkout.tsx` - Add auth check (or use withAuth)

### **New Files to Create:**
1. `shared/lib/withAuth.tsx` - Route protection HOC

### **Files Already Integrated (No Changes Needed):**
1. `shared/lib/analytics.ts` - ✅ Already integrated with UserContext
2. `shared/lib/featureFlags.ts` - ✅ Already integrated with UserContext
3. `shared/lib/multiUserDataManager.ts` - ✅ Already used by dashboard
4. `features/intake/engine/targetGroupDetection.ts` - ✅ Working independently
5. `shared/components/common/TargetGroupBanner.tsx` - ✅ Working

### **Optional Enhancements:**
1. `middleware.ts` - Next.js middleware for route protection
2. `pages/settings.tsx` - User settings page
3. `pages/profile.tsx` - User profile page
4. Sync target group with user segment (if needed)

---

## 🔍 **DECISION POINTS**

1. **Should `/reco` require auth?**
   - Option A: Require auth (forces login before wizard)
   - Option B: Allow guest mode, require auth at `/results` or `/editor`
   - **Recommendation:** Option B (better UX, lower friction)

2. **Should `/` (home) require auth?**
   - **Recommendation:** No (public landing page)

3. **Should logout clear all localStorage?**
   - **Recommendation:** Clear only user-specific data, keep preferences

4. **Should dashboard be accessible without auth?**
   - **Recommendation:** No (requires login)

---

## ✅ **SUMMARY**

**Current State:**
- ✅ Login page works
- ✅ Dashboard exists
- ✅ UserContext provides state
- ✅ Analytics integrated with UserContext
- ✅ Feature flags integrated with UserContext
- ✅ Multi-user data manager exists and used by dashboard
- ✅ Target group detection working
- ✅ **Route protection implemented** - All workflow pages protected with `withAuth` HOC
- ✅ **Logout functionality added** - Header has logout button
- ✅ **Redirect logic implemented** - Unauthenticated users redirected to login with redirect parameter
- ✅ **Dashboard data integration complete** - Plans saved from editor, recommendations saved from results
- ✅ **Multi-user data integration complete** - Plans and recommendations associated with clients

**Recommended Actions:**
1. Create `withAuth` HOC
2. Protect workflow pages
3. Add logout to header
4. Update login to handle redirects
5. Integrate dashboard with workflow data
6. Ensure multi-user data is properly assigned in editor/results

**Estimated Effort:** 2-3 hours for core implementation

---

## 📊 **DATA FLOW SUMMARY**

### **User Data Storage:**
- **`localStorage.pf_user_profile`** - User profile (set by UserContext)
- **`localStorage.userPlans`** - User's business plans (read by dashboard)
- **`localStorage.userRecommendations`** - User's recommendations (read by dashboard)
- **`localStorage.pf_clients`** - Client workspaces (multi-user data manager)
- **`localStorage.pf_session_id`** - Analytics session ID
- **`localStorage.selectedTargetGroup`** - Target group selection
- **`localStorage.pf_feature_flags`** - Feature flag configuration

### **Integration Points:**
1. **UserContext → Analytics:** Sets `userId` on login
2. **UserContext → FeatureFlags:** Sets user context (segment, userId) on login
3. **Dashboard → MultiUserDataManager:** Filters plans by client
4. **Home → TargetGroupDetection:** Customizes content based on target group
5. **Login → UserContext:** Sets user profile and triggers all integrations

### **Integration Status:**
1. ✅ **Workflow Pages → Dashboard:** Plans/recommendations now saved to localStorage via `savePlanToDashboard()` and `saveRecommendationToDashboard()`
2. ✅ **Editor → MultiUserDataManager:** Plans assigned to clients when saving via `multiUserDataManager.assignPlanToClient()`
3. ✅ **Results → Dashboard:** Recommendations saved when user views results page

### **Implementation Details:**
- **Helper Functions Added to `planStore.ts`:**
  - `savePlanToDashboard()` - Saves plans to `localStorage.userPlans` with progress calculation
  - `saveRecommendationToDashboard()` - Saves recommendations to `localStorage.userRecommendations`
  
- **Editor Integration (`Phase4Integration.tsx`):**
  - Saves plan to dashboard when sections are updated (debounced)
  - Associates plan with active client if in multi-user mode
  - Calculates progress and status automatically
  
- **Results Integration (`results.tsx`):**
  - Saves all recommendations to dashboard when page loads
  - Associates recommendations with active client if in multi-user mode

