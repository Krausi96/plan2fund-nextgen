# Dashboard Data & Admin Access Guide

**Date:** 2025-01-27  
**Purpose:** Explain what data is shown in dashboard, admin access, and data storage

---

## 📊 **DASHBOARD DATA OVERVIEW**

### **What Users See in Dashboard:**

#### **1. Statistics Cards (Top Row)**
- **Total Plans** - Count of all business plans created
- **Completed Plans** - Count of plans with status "completed"
- **Active Applications** - Count of recommendations with status "pending" or "applied"
- **Success Rate** - Percentage of completed plans (completed / total)

#### **2. Recent Business Plans Section**
**Data Shown:**
- Plan title
- Program type (GRANT, LOAN, etc.)
- Last modified date
- Progress bar (0-100%)
- Status badge (draft, in_progress, completed)

**Data Source:** `localStorage.userPlans`
**Filtered By:**
- User ID (`userId` matches logged-in user)
- Client ID (if multi-user mode, only shows plans for selected client)

**Each Plan Contains:**
```typescript
{
  id: string;                    // Unique plan ID
  userId: string;                 // User who created it
  clientId?: string;              // Client workspace (if consultant)
  title: string;                  // Plan title
  status: 'draft' | 'in_progress' | 'completed';
  lastModified: string;           // ISO timestamp
  programType: string;            // GRANT, LOAN, etc.
  progress: number;               // 0-100 percentage
}
```

#### **3. Active Applications Section**
**Data Shown:**
- Recommendation/Program name
- Type (grant, loan, visa, etc.)
- Amount
- Deadline (if available)
- Status badge (pending, applied, rejected, approved)

**Data Source:** `localStorage.userRecommendations`
**Filtered By:**
- User ID (`userId` matches logged-in user)
- Client ID (if multi-user mode, only shows recommendations for selected client)

**Each Recommendation Contains:**
```typescript
{
  id: string;                    // Unique recommendation ID
  userId: string;                // User who received it
  clientId?: string;             // Client workspace (if consultant)
  name: string;                   // Program name
  type: string;                   // Grant, loan, visa, etc.
  status: 'pending' | 'applied' | 'rejected' | 'approved';
  amount: string;                 // Funding amount
  deadline?: string;              // Application deadline
}
```

#### **4. Quick Actions**
- Find Funding (links to `/reco`)
- Get Recommendations (links to `/reco`)
- Create Plan (links to `/editor`)
- Get Help (links to `/contact`)

#### **5. Client Workspace Selector (Multi-User Mode)**
- Dropdown to switch between clients
- "Manage Clients" button to add/edit/delete clients
- Filters plans and recommendations by selected client

---

## 🔐 **ADMIN ACCESS**

### **How to Access Admin Panel:**

Currently, admin access is determined by:

1. **User ID Check:**
   - User ID contains "admin" (e.g., `admin@plan2fund.com`)
   - OR user ID is exactly `kevin@plan2fund.com`
   - OR `localStorage.isAdmin === 'true'`

2. **Location:** Admin panel appears at the bottom of dashboard (only visible to admins)

### **Admin Panel Features:**

#### **1. Data Update Section**
- **Button:** "Update Data" button to trigger funding database update
- **Function:** Calls `/api/scraper/run` to scrape funding websites
- **Status:** Shows last update time and current update status
- **Process:** Typically takes 2-5 minutes

#### **2. System Status Display**
- Pattern Learning: Active
- Categories: 18 Active
- Auto-Update: Manual
- Data Sources: Austrian/EU

### **How to Enable Admin Access:**

**Option 1: Login with Admin Email**
```typescript
// Login with email containing "admin"
Email: admin@plan2fund.com
// OR
Email: kevin@plan2fund.com
```

**Option 2: Set Admin Flag in localStorage**
```javascript
// In browser console:
localStorage.setItem('isAdmin', 'true');
// Then refresh dashboard
```

**Option 3: Modify Admin Check Logic**
Edit `pages/dashboard.tsx` line 136-138:
```typescript
const isAdminUser = userProfile?.id?.includes('admin') || 
                   userProfile?.id === 'kevin@plan2fund.com' ||
                   userProfile?.id === 'your-admin-email@domain.com' || // Add your email
                   localStorage.getItem('isAdmin') === 'true';
```

---

## 💾 **DATA STORAGE LOCATION**

### **Current Storage: localStorage (Client-Side)**

All user data is currently stored in the browser's `localStorage`. This is **NOT** a database - it's client-side storage that:
- ✅ Persists across browser sessions
- ✅ Is fast and accessible
- ❌ Is NOT shared across devices
- ❌ Can be cleared by user
- ❌ Is NOT suitable for production (should use database)

### **Storage Keys and Data:**

#### **1. User Profile**
**Key:** `pf_user_profile`
**Contains:**
```typescript
{
  id: string;                    // User email (lowercase)
  segment: 'B2C_FOUNDER' | 'SME_LOAN' | 'VISA' | 'PARTNER';
  programType: string;
  industry: string;
  language: string;
  payerType: string;
  experience: string;
  createdAt: string;              // ISO timestamp
  lastActiveAt: string;          // ISO timestamp
  gdprConsent: boolean;
}
```
**Location:** `shared/contexts/UserContext.tsx`
**Read/Write:** `UserContext.setUserProfile()`, `clearUserProfile()`

#### **2. User Plans**
**Key:** `userPlans`
**Contains:** Array of `DashboardPlan` objects
```typescript
[
  {
    id: string;
    userId: string;
    clientId?: string;
    title: string;
    status: 'draft' | 'in_progress' | 'completed';
    lastModified: string;
    programType: string;
    progress: number;
  },
  // ... more plans
]
```
**Location:** `shared/lib/planStore.ts`
**Read/Write:** `savePlanToDashboard()`, loaded in dashboard
**Saved From:** `features/editor/components/Phase4Integration.tsx`

#### **3. User Recommendations**
**Key:** `userRecommendations`
**Contains:** Array of `DashboardRecommendation` objects
```typescript
[
  {
    id: string;
    userId: string;
    clientId?: string;
    name: string;
    type: string;
    status: 'pending' | 'applied' | 'rejected' | 'approved';
    amount: string;
    deadline?: string;
  },
  // ... more recommendations
]
```
**Location:** `shared/lib/planStore.ts`
**Read/Write:** `saveRecommendationToDashboard()`, loaded in dashboard
**Saved From:** `pages/results.tsx`

#### **4. Client Workspaces (Multi-User)**
**Key:** `pf_clients`
**Contains:** Array of client objects
```typescript
[
  {
    id: string;                   // client_1234567890_abc123
    name: string;                  // Client name
  },
  // ... more clients
]
```
**Location:** `shared/lib/multiUserDataManager.ts`
**Read/Write:** `multiUserDataManager.listClients()`, `saveClient()`

#### **5. Plan Sections (Editor Content)**
**Key:** `pf_plan_sections_{sessionId}`
**Contains:**
```typescript
{
  v: 1,
  sections: [
    {
      id: string;
      title: string;
      content: string;             // Rich text HTML
      tables?: any;
      figures?: any[];
      sources?: Array<{ title: string; url: string }>;
    },
    // ... more sections
  ]
}
```
**Location:** `shared/lib/planStore.ts`
**Read/Write:** `savePlanSections()`, `loadPlanSections()`
**Saved From:** Editor automatically (debounced)

#### **6. User Answers (Wizard Results)**
**Key:** `pf_userAnswers_{sessionId}`
**Contains:** Object with wizard answers
```typescript
{
  question1: answer1,
  question2: answer2,
  // ... etc
}
```
**Location:** `shared/lib/planStore.ts`
**Read/Write:** `saveUserAnswers()`, `loadUserAnswers()`

#### **7. Analytics Session**
**Key:** `pf_session_id`
**Contains:** Session ID string
**Location:** `shared/lib/analytics.ts`

#### **8. Target Group**
**Key:** `selectedTargetGroup`
**Contains:** String ('startups', 'sme', 'advisors', 'universities', 'default')
**Location:** `features/intake/engine/targetGroupDetection.ts`

#### **9. Feature Flags**
**Key:** `pf_feature_flags`
**Contains:** Feature flag configuration
**Location:** `shared/lib/featureFlags.ts`

#### **10. GDPR Consent**
**Key:** `pf_gdpr_consent`
**Contains:**
```typescript
{
  accepted: boolean;
  timestamp: string;
  version: string;
  settings: {
    analytics: boolean;
    marketing: boolean;
    personalization: boolean;
    dataRetention: string;
  }
}
```
**Location:** `pages/privacy-settings.tsx`

---

## ✅ **IS EVERYTHING WIRED?**

### **Fully Wired ✅:**
1. ✅ **User Authentication** - Login/logout works
2. ✅ **Dashboard Data Display** - Shows plans and recommendations
3. ✅ **Plan Saving** - Editor saves plans to dashboard
4. ✅ **Recommendation Saving** - Results page saves recommendations
5. ✅ **Client Management** - Add/edit/delete clients works
6. ✅ **Client Filtering** - Dashboard filters by selected client
7. ✅ **Admin Panel** - Visible to admins, data update button works
8. ✅ **Multi-User Data** - Plans/recommendations associated with clients
9. ✅ **Email Notifications** - Welcome email, payment confirmations
10. ✅ **Route Protection** - All workflow pages protected

### **Partially Wired ⚠️:**
1. ⚠️ **Email Service** - Configured but needs API key
   - Set `RESEND_API_KEY` or `EMAIL_SERVICE_API_KEY` in `.env`
   - Currently logs emails in dev mode

2. ⚠️ **Payment Unlocking** - Payment status not tracked
   - Plans don't unlock after payment
   - Watermarks not removed after payment

3. ⚠️ **Database Integration** - Currently localStorage only
   - No backend database
   - Data not synced across devices
   - No server-side persistence

### **Not Wired ❌:**
1. ❌ **Admin User Management** - No UI to manage admin users
2. ❌ **Data Export/Import** - No bulk data operations
3. ❌ **Payment History** - No payment records in dashboard
4. ❌ **Analytics Dashboard** - No admin analytics view

---

## 🔄 **DATA FLOW**

### **How Data Flows:**

```
1. USER LOGS IN
   ↓
   UserContext.setUserProfile()
   ↓
   localStorage.pf_user_profile = userProfile
   ↓
   Dashboard loads and filters data by userId

2. USER CREATES PLAN
   ↓
   Editor saves plan sections
   ↓
   localStorage.pf_plan_sections_{sessionId} = sections
   ↓
   Editor debounced save triggers
   ↓
   savePlanToDashboard() called
   ↓
   localStorage.userPlans.push(plan)
   ↓
   Dashboard shows updated plan list

3. USER GETS RECOMMENDATIONS
   ↓
   Results page loads recommendations
   ↓
   saveRecommendationToDashboard() called for each
   ↓
   localStorage.userRecommendations.push(recommendation)
   ↓
   Dashboard shows updated recommendations

4. CONSULTANT ADDS CLIENT
   ↓
   ClientManager.saveClient()
   ↓
   localStorage.pf_clients.push(client)
   ↓
   Dashboard shows client in dropdown
   ↓
   Plans/recommendations filtered by clientId
```

---

## 🗄️ **MIGRATION TO DATABASE (Future)**

### **Current State:**
- All data in `localStorage` (client-side only)
- No backend database
- No data persistence across devices

### **Recommended Migration:**
1. **Create Database Schema:**
   - Users table
   - Plans table
   - Recommendations table
   - Clients table
   - Payments table

2. **Create API Endpoints:**
   - `/api/user/profile` - Already exists (mocked)
   - `/api/plans` - CRUD operations
   - `/api/recommendations` - CRUD operations
   - `/api/clients` - CRUD operations

3. **Update Data Storage:**
   - Replace `localStorage` with API calls
   - Keep localStorage as cache/fallback
   - Add sync mechanism

4. **Admin Features:**
   - User management UI
   - Data export/import
   - Analytics dashboard
   - System monitoring

---

## 📝 **SUMMARY**

### **Dashboard Shows:**
- ✅ User's plans (filtered by user + client)
- ✅ User's recommendations (filtered by user + client)
- ✅ Statistics (calculated from plans/recommendations)
- ✅ Admin panel (if admin user)

### **Admin Access:**
- ✅ Login with email containing "admin"
- ✅ OR set `localStorage.isAdmin = 'true'`
- ✅ Admin panel visible at bottom of dashboard

### **Data Storage:**
- ⚠️ **Current:** All data in `localStorage` (client-side)
- ⚠️ **Limitation:** Not synced across devices
- ⚠️ **Future:** Should migrate to database

### **Everything Wired:**
- ✅ Core features fully wired
- ⚠️ Email needs API key configuration
- ⚠️ Payment unlocking needs implementation
- ❌ Database integration needed for production

