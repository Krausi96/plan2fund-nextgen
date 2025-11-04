# Business Plan Flow Analysis & Fixes

**Date:** 2025-01-27  
**Flow:** Preview → Checkout → Export → Thank You → Email & Dashboard

---

## 🔍 **CURRENT FLOW ANALYSIS**

### **1. Preview Page (`/preview`)**
**What it does:**
- ✅ Shows plan preview
- ✅ Shows additional documents available
- ✅ Has formatting options
- ❌ **MISSING:** No button to go to checkout
- ❌ **MISSING:** Plan ID not passed to checkout

### **2. Checkout Page (`/checkout`)**
**What it does:**
- ✅ Shows cart summary
- ✅ Creates Stripe checkout session
- ✅ Redirects to Stripe
- ❌ **MISSING:** Doesn't receive planId from preview
- ❌ **MISSING:** Doesn't pass planId to payment metadata
- ❌ **MISSING:** Items don't include planId

### **3. Export Page (`/export`)**
**What it does:**
- ✅ Exports plan PDF/DOCX
- ✅ Exports additional documents
- ✅ Exports add-ons (one-pager, submission pack)
- ❌ **MISSING:** Exported documents not saved to dashboard
- ❌ **MISSING:** No email sent with document links
- ❌ **MISSING:** No document access tracking

### **4. Thank You Page (`/thank-you`)**
**What it does:**
- ✅ Verifies payment
- ✅ Saves payment record
- ✅ Shows revision request form
- ❌ **MISSING:** Doesn't trigger export email
- ❌ **MISSING:** Doesn't save exported documents to dashboard
- ❌ **MISSING:** No document access links

---

## ❌ **WHAT'S MISSING**

### **1. Navigation Flow**
- Preview → Checkout (no button)
- Checkout → Export (should redirect after payment)
- Export → Thank You (redirects, but no data passed)

### **2. Plan ID Tracking**
- Plan ID not passed through flow
- Payment doesn't associate with plan
- Export doesn't know which plan was exported

### **3. Document Management**
- Exported documents not saved to dashboard
- No document access tracking
- No document download links

### **4. Email Delivery**
- No email sent with exported documents
- No document access links in email
- No summary of what was exported

---

## ✅ **FIXES NEEDED**

### **1. Add Navigation: Preview → Checkout**
- Add "Continue to Checkout" button in preview
- Pass planId as query parameter

### **2. Update Checkout to Track Plan**
- Get planId from query params
- Include planId in payment metadata
- Pass planId to Stripe session

### **3. Save Exported Documents**
- Create document storage system
- Save exported documents to dashboard
- Track document access

### **4. Email with Documents**
- After payment, generate document links
- Send email with all exported documents
- Include document access dashboard link

### **5. Document Dashboard Integration**
- Add "My Documents" section to dashboard
- Show all exported documents
- Provide download links

