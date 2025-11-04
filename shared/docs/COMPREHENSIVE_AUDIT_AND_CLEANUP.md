# 🔍 COMPREHENSIVE AUDIT & CLEANUP PLAN

**Date:** 2025-01-03  
**Goal:** ONE source of truth, remove dead code, complete wiring, wire payment

---

## 📋 **AUDIT FINDINGS**

### **1. MULTIPLE DATA SOURCES (NEEDS UNIFICATION)**

**Problem:** Data stored in multiple places - no single source of truth

**Found Storage Locations:**
1. `localStorage.userAnswers` - Wizard answers
2. `localStorage.enhancedPayload` - Enhanced payload
3. `localStorage.selectedProgram` - Selected program
4. `localStorage.planSeed` - Plan seed (intake)
5. `localStorage.plan_settings` - Plan settings
6. `planStore.ts` (localStorage wrapper) - Plan sections
7. Database (Neon PostgreSQL) - Programs, requirements
8. JSON files (scraper-lite) - Fallback

**Issues:**
- Plan data scattered across multiple localStorage keys
- No single place to read/write plan state
- `planStore.ts` exists but not used consistently

**Fix:**
- Use `planStore.ts` as SINGLE source of truth for plan sections
- Consolidate all localStorage access through `planStore`
- Remove direct localStorage calls for plan data

---

### **2. PAYMENT WIRING - BROKEN**

**Current State:**
- `/api/payments/create-session.ts` exists but NOT called
- `/api/payments/success.ts` exists but NOT called
- `/api/stripe/webhook.ts` exists but NOT wired
- Checkout page has stub payment (doesn't call API)

**Missing Connections:**
1. Checkout → Create Stripe session
2. Stripe redirect → Success page
3. Webhook → Update payment status

**Fix Needed:**
- Wire checkout to call `/api/payments/create-session`
- Handle Stripe redirect to success page
- Wire webhook to process payments

---

### **3. UNUSED/DEAD CODE TO IDENTIFY**

**Need to Check:**
- Components not imported anywhere
- API endpoints not called
- Utility functions not used
- Duplicate implementations

---

### **4. DOCUMENTATION GAPS**

**Existing Docs:**
- `docs/COMPLETE_FLOW_ANALYSIS.md` - Flow analysis
- `docs/MISSING_CONNECTIONS.md` - Missing connections
- `docs/COMPREHENSIVE_AUDIT.md` - Previous audit
- `docs/ACTION_PLAN.md` - Action plan

**Missing:**
- Single source of truth documentation
- Payment flow documentation
- Storage architecture documentation

---

## 🎯 **ACTION PLAN**

### **Phase 1: Consolidate Data Storage**

1. **Audit all localStorage usage**
   - Find all `localStorage.setItem` / `localStorage.getItem`
   - Map what each key stores
   - Consolidate into `planStore.ts`

2. **Update planStore.ts**
   - Make it the SINGLE source for:
     - Plan sections
     - User answers (wizard)
     - Selected program
     - Plan settings
   - Remove direct localStorage calls

3. **Update all components**
   - Replace direct localStorage with planStore
   - Ensure consistent API

---

### **Phase 2: Wire Payment**

1. **Wire Checkout → Stripe**
   - Call `/api/payments/create-session` from checkout
   - Handle session creation
   - Redirect to Stripe checkout

2. **Wire Stripe → Success**
   - Handle Stripe redirect
   - Call `/api/payments/success` to verify payment
   - Route to thank-you page with download link

3. **Wire Webhook**
   - Ensure webhook endpoint processes payments
   - Update payment status in database (if needed)

---

### **Phase 3: Remove Dead Code**

1. **Find unused components**
   - Search for components not imported
   - Remove orphaned files

2. **Find unused API endpoints**
   - Check which endpoints are called
   - Remove unused ones

3. **Find duplicate code**
   - Identify duplicate implementations
   - Consolidate into single source

---

### **Phase 4: Complete Wiring**

1. **Verify all flows work**
   - Wizard → Editor → Preview → Export → Payment → Thank You
   - Test each step

2. **Fix any broken connections**
   - Ensure data flows correctly
   - Fix any missing links

---

## 📊 **PRIORITY ORDER**

1. 🔴 **HIGH:** Consolidate data storage (planStore as single source)
2. 🔴 **HIGH:** Wire payment flow (checkout → stripe → success)
3. 🟡 **MEDIUM:** Remove dead code
4. 🟡 **MEDIUM:** Complete documentation
5. 🟢 **LOW:** Optimize and refactor

---

## ✅ **SUCCESS CRITERIA**

- [ ] ONE source of truth for plan data (planStore)
- [ ] Payment flow fully wired (checkout → stripe → success → thank-you)
- [ ] All dead code removed
- [ ] All flows working end-to-end
- [ ] Documentation updated

