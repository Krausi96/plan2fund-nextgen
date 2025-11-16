# API Directory Analysis Report

## Executive Summary

This analysis identifies unused code, reorganization opportunities, and integration potential in the `pages/api` directory.

---

## 1. Unused Code/Files

### 🔴 **test-email.ts** - UNUSED
- **Location**: `pages/api/test-email.ts`
- **Status**: No references found in codebase
- **Purpose**: Development-only email testing endpoint
- **Recommendation**: 
  - **Option A**: Remove if not needed
  - **Option B**: Keep but document as dev-only utility
  - **Action**: Verify with team if this is still needed for testing

### 🟡 **stripe/webhook.ts** - STUBBED/INCOMPLETE
- **Location**: `pages/api/stripe/webhook.ts`
- **Status**: Stubbed implementation (returns 200 for any POST)
- **Issue**: Not processing actual Stripe webhook events
- **Recommendation**: 
  - Implement proper webhook signature verification
  - Handle Stripe events (payment_intent.succeeded, checkout.session.completed, etc.)
  - Integrate with payment success flow

---

## 2. Reorganization Opportunities

### 🔵 **Programs Endpoints - Duplicate Concerns**

**Files:**
- `pages/api/programs.ts` - Static JSON file loader
- `pages/api/programmes/[id]/requirements.ts` - Database-based requirements

**Issue**: 
- Both handle program data but from different sources (static JSON vs database)
- `programs.ts` has transformation logic that could be shared
- Naming inconsistency: `programs` vs `programmes`

**Recommendation**:
```
pages/api/
  programs/
    index.ts              # GET /api/programs (static JSON)
    [id]/
      requirements.ts     # GET /api/programs/[id]/requirements
    recommend.ts          # POST /api/programs/recommend
```

**Benefits**:
- Consistent naming
- Clear separation of concerns
- Shared utilities can be extracted

---

### 🔵 **Consent Endpoints - Can Be Consolidated**

**Files:**
- `pages/api/data-collection/consent.ts` - POST (set consent)
- `pages/api/data-collection/consent/[userId].ts` - GET (get consent)

**Issue**: Two files for one resource (consent)

**Recommendation**:
```typescript
// pages/api/data-collection/consent/[userId].ts
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { userId } = req.query;
  
  if (req.method === 'GET') {
    // Get consent logic
  } else if (req.method === 'POST') {
    // Set consent logic
  } else {
    return res.status(405).json({ error: 'Method not allowed' });
  }
}
```

**Benefits**:
- Single source of truth
- Easier to maintain
- RESTful design

---

### 🔵 **Usage Endpoints - Can Be Consolidated**

**Files:**
- `pages/api/usage/track.ts` - POST (track usage)
- `pages/api/usage/[userId].ts` - GET (get usage)

**Issue**: Two files for one resource (usage)

**Recommendation**: Same pattern as consent - consolidate into `usage/[userId].ts` with GET and POST methods.

---

### 🔵 **Payment Endpoints - Related Functionality**

**Files:**
- `pages/api/payments/create-session.ts` - Create Stripe session
- `pages/api/payments/success.ts` - Handle payment success
- `pages/api/stripe/webhook.ts` - Stripe webhook (stubbed)

**Issue**: Payment logic is split across multiple files

**Recommendation**:
```
pages/api/
  payments/
    sessions.ts        # POST /api/payments/sessions (create)
    success.ts        # POST /api/payments/success (handle success)
    webhook.ts        # POST /api/payments/webhook (Stripe webhook)
```

**Benefits**:
- All payment logic in one place
- Easier to understand flow
- Better organization

---

## 3. Integration Potential

### 🟢 **Database Connection Pattern - Inconsistent**

**Current State**:
- Some files use shared connection: `getPool()` from `@/shared/lib/database`
  - `pages/api/programmes/[id]/requirements.ts`
  - `pages/api/db/setup.ts`
- Some files create their own Pool:
  - `pages/api/data-collection/consent.ts`
  - `pages/api/data-collection/consent/[userId].ts`
  - `pages/api/usage/track.ts`
  - `pages/api/usage/[userId].ts`
  - `pages/api/data-collection/plans.ts`

**Recommendation**:
- **Standardize on shared connection**: Use `getPool()` from `@/shared/lib/database` everywhere
- **Benefits**:
  - Connection pooling
  - Consistent error handling
  - Easier to manage database configuration
  - Better for production scaling

**Action Items**:
1. Create migration script to update all files
2. Remove individual Pool instances
3. Update imports to use shared connection

---

### 🟢 **Error Handling - No Standard Pattern**

**Current State**: Each endpoint handles errors differently

**Recommendation**: Create shared error handler utility

```typescript
// shared/lib/api/errorHandler.ts
export function handleApiError(
  error: unknown,
  res: NextApiResponse,
  context?: string
) {
  console.error(`API Error${context ? ` in ${context}` : ''}:`, error);
  
  const message = error instanceof Error ? error.message : 'Unknown error';
  const status = error instanceof ApiError ? error.statusCode : 500;
  
  return res.status(status).json({
    error: message,
    ...(process.env.NODE_ENV === 'development' && { stack: error instanceof Error ? error.stack : undefined })
  });
}
```

---

### 🟢 **CORS Handling - Inconsistent**

**Current State**:
- Some endpoints set CORS headers: `programs.ts`
- Some don't: Most other endpoints
- Inconsistent patterns

**Recommendation**: Create shared CORS middleware

```typescript
// shared/lib/api/cors.ts
export function setCorsHeaders(res: NextApiResponse, allowedMethods: string[] = ['GET', 'POST']) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', allowedMethods.join(', '));
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
}
```

---

### 🟢 **Shared Transformation Logic**

**Location**: `pages/api/programs.ts` has transformation functions:
- `transformEligibilityToCategorized()`
- `calculateCompletenessScore()`
- `isProgramFresh()`

**Recommendation**: Extract to shared utility

```typescript
// shared/lib/programs/transformations.ts
export { transformEligibilityToCategorized, calculateCompletenessScore, isProgramFresh };
```

**Benefits**:
- Reusable across endpoints
- Easier to test
- Single source of truth

---

### 🟢 **Authentication Middleware - Missing**

**Current State**: Each auth endpoint implements its own logic

**Recommendation**: Create shared auth middleware

```typescript
// shared/lib/api/auth.ts
export async function requireAuth(req: NextApiRequest, res: NextApiResponse) {
  const sessionToken = getSessionTokenFromCookie(req.headers.cookie);
  if (!sessionToken) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  // ... verify session
  return { user, session };
}
```

---

## 4. File Structure Recommendations

### Proposed Structure

```
pages/api/
├── auth/
│   ├── login.ts
│   ├── logout.ts
│   ├── register.ts
│   └── session.ts
├── programs/
│   ├── index.ts                    # GET /api/programs (from static JSON)
│   ├── [id]/
│   │   └── requirements.ts         # GET /api/programs/[id]/requirements
│   └── recommend.ts                # POST /api/programs/recommend
├── payments/
│   ├── sessions.ts                 # POST /api/payments/sessions
│   ├── success.ts                  # POST /api/payments/success
│   └── webhook.ts                  # POST /api/payments/webhook
├── data-collection/
│   ├── consent/
│   │   └── [userId].ts             # GET/POST /api/data-collection/consent/[userId]
│   ├── plans.ts
│   ├── export.ts
│   ├── templates.ts
│   └── scraper-quality.ts
├── usage/
│   └── [userId].ts                 # GET/POST /api/usage/[userId]
├── user/
│   └── profile.ts
├── analytics/
│   └── track.ts
├── images/
│   └── upload.ts
├── plan/
│   └── save.ts
├── ai/
│   └── openai.ts
├── gdpr/
│   └── delete-data.ts
├── db/
│   └── setup.ts
└── test-email.ts                   # Dev-only, consider removing
```

---

## 5. Priority Action Items

### High Priority
1. ✅ **Consolidate consent endpoints** (2 files → 1)
2. ✅ **Consolidate usage endpoints** (2 files → 1)
3. ✅ **Standardize database connections** (use shared `getPool()`)
4. ✅ **Implement Stripe webhook** (currently stubbed)

### Medium Priority
5. ✅ **Reorganize programs endpoints** (consistent naming/structure)
6. ✅ **Create shared error handler**
7. ✅ **Create shared CORS middleware**
8. ✅ **Extract transformation utilities** from `programs.ts`

### Low Priority
9. ✅ **Create auth middleware** (if needed)
10. ✅ **Document or remove test-email.ts**

---

## 6. Code Quality Improvements

### Type Safety
- Many endpoints use `any` types
- Consider creating shared types for common request/response patterns

### Validation
- Add input validation using a library like `zod` or `yup`
- Consistent validation across all endpoints

### Logging
- Standardize logging format
- Add request ID tracking for debugging

### Testing
- No test files found in API directory
- Consider adding API tests for critical endpoints

---

## 7. Summary Statistics

- **Total API Files**: 26
- **Unused Files**: 1 (`test-email.ts`)
- **Incomplete Files**: 1 (`stripe/webhook.ts`)
- **Consolidation Opportunities**: 6 files can be merged into 3
- **Database Connection Issues**: 5 files need migration to shared connection
- **Missing Shared Utilities**: Error handling, CORS, auth middleware

---

## Next Steps

1. Review this analysis with the team
2. Prioritize action items based on business needs
3. Create tickets for each improvement
4. Implement changes incrementally
5. Update documentation as changes are made

