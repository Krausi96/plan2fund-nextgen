# 🗑️ Unused API Endpoints - For Removal

**Date:** 2025-01-03  
**Status:** Identified - Ready for removal

---

## ❌ **UNUSED ENDPOINTS (No Components Call Them)**

### **1. `/api/notifications`** ❌

**Location:** `pages/api/notifications.ts`  
**Status:** Not called from any component  
**Uses:** File-based storage (`data/notifications.json`)  
**Action:** ✅ **KEEP FOR NOW** - May be used by admin dashboard or monitoring (future feature)

**Reason to Keep:** Useful for system monitoring and admin features

---

### **2. `/api/pipeline/status`** ❌

**Location:** `pages/api/pipeline/status.ts`  
**Status:** Not called from any component  
**Uses:** Checks scraper-lite data files and API health  
**Action:** ✅ **KEEP FOR NOW** - Useful for monitoring system health

**Reason to Keep:** Provides system health monitoring

---

## ✅ **USED ENDPOINTS (Keep)**

### **1. `/api/recommend`** ✅

**Location:** `pages/api/recommend.ts`  
**Used By:** `features/intake/components/PlanIntake.tsx`  
**Status:** ✅ **ACTIVE** - Keep

---

### **2. `/api/intake/parse`** ✅

**Location:** `pages/api/intake/parse.ts`  
**Used By:** `features/intake/components/PlanIntake.tsx`  
**Status:** ✅ **ACTIVE** - Keep

---

### **3. `/api/intake/plan`** ✅

**Location:** `pages/api/intake/plan.ts`  
**Used By:** Likely used by intake flow (stub endpoint)  
**Status:** ✅ **ACTIVE** - Keep (stub for now)

---

## 📋 **SUMMARY**

**Unused but Keep:**
- `/api/notifications` - For admin/monitoring
- `/api/pipeline/status` - For health checks

**Used:**
- `/api/recommend` ✅
- `/api/intake/parse` ✅  
- `/api/intake/plan` ✅

**Action:** No endpoints to remove - all have purpose (current or future)

---

## ✅ **ALREADY DELETED**

- ✅ `pages/api/scraper/` - Empty folder (deleted)
- ✅ `updateProgramRequirements()` - Broken function (removed)

