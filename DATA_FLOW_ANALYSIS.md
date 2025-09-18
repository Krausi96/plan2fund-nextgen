# Plan2Fund Data Flow Analysis

## **🔄 COMPLETE USER JOURNEY FLOW**

### **1. Entry Points**
- **`/` (index.tsx)** - Landing page with Hero, UseCases, PlanTypes
- **`/reco` (reco.tsx)** - Recommendation wizard entry point
- **`/demo-intake` (demo-intake.tsx)** - Intake layer demo

### **2. Recommendation Flow**
```
/reco → Wizard → /results → /plan/intake → /editor → /thank-you
```

**Detailed Flow:**
1. **`/reco`** - User starts recommendation wizard
2. **Wizard Component** - Collects user answers via questions
3. **`/results`** - Shows funding recommendations with eligibility
4. **"Continue to Plan"** button → **`/plan/intake?programId=X`**
5. **`/plan/intake`** - Plan intake with program prefill
6. **`/editor`** - Business plan editor
7. **Export/Complete** → **`/thank-you`** - Success page

### **3. Direct Plan Creation Flow**
```
/editor → Onboarding → Editor → Export → /thank-you
```

**Detailed Flow:**
1. **`/editor`** - Direct access to editor
2. **SegmentedOnboarding** - If user hasn't completed onboarding
3. **ProgramAwareEditor** - Main editor interface
4. **Export/Complete** → **`/thank-you`** - Success page

## **📊 DATA FLOW CONNECTIONS**

### **✅ CONNECTED PAGES**

#### **A) Recommendation Pipeline**
- **`/reco`** ↔ **`/results`** ✅
  - Wizard stores answers in localStorage
  - Results page reads from localStorage
  - "Continue to Plan" links to `/plan/intake?programId=X`

- **`/results`** ↔ **`/plan/intake`** ✅
  - Program ID passed via URL params
  - Plan intake can prefill based on program

- **`/plan/intake`** ↔ **`/editor`** ✅
  - Plan intake creates plan document
  - Editor loads plan and program context

#### **B) Editor Pipeline**
- **`/editor`** ↔ **`/thank-you`** ✅
  - Editor redirects to thank-you on export success
  - Success page shows completion confirmation

#### **C) Payment Pipeline**
- **`/confirm`** ↔ **`/checkout`** ✅
  - Confirm page links to checkout
  - Checkout processes payment

- **`/checkout`** ↔ **`/thank-you`** ✅
  - Payment success redirects to thank-you
  - Thank-you shows order confirmation

### **❌ MISSING CONNECTIONS**

#### **A) Intake Layer Integration**
- **`/demo-intake`** ↔ **Main Flow** ❌
  - Demo intake page exists but not connected to main flow
  - Should integrate with recommendation wizard

#### **B) Pricing Integration**
- **`/pricing`** ↔ **`/confirm`** ❌
  - Pricing page exists but no clear path to confirmation
  - Missing "Choose Plan" → "Confirm Order" flow

#### **C) Legal Pages**
- **`/legal`** ↔ **Main Flow** ❌
  - Legal page exists but not linked from main flow
  - Should be accessible from footer/navigation

#### **D) Privacy Settings**
- **`/privacy-settings`** ↔ **Main Flow** ❌
  - Privacy settings page exists but not accessible
  - Should be linked from user profile/settings

## **🔗 NAVIGATION ANALYSIS**

### **✅ WORKING NAVIGATION**
```typescript
// From results.tsx
<Link href={`/plan/intake?programId=${program.id}`}>
  <Button className="w-full mt-3">Prefill and continue →</Button>
</Link>

// From editor.tsx
if (showSuccessHub && currentPlan) {
  router.push('/thank-you');
  return null;
}

// From confirm.tsx
<Link href="/checkout" aria-disabled={!CHECKOUT_ENABLED}>
  Proceed to Checkout
</Link>
<Link href="/thank-you">Skip payment (Demo)</Link>
```

### **❌ MISSING NAVIGATION**
- No clear path from landing page to recommendation wizard
- No pricing integration with main flow
- No legal/privacy page links
- No user profile/settings navigation

## **📋 MISSING PAGES/COMPONENTS**

### **1. Critical Missing**
- **User Profile/Settings Page** - No user account management
- **Dashboard/Home for Logged-in Users** - No personalized landing
- **Program Details Page** - Individual program information
- **Help/Support Page** - User support and FAQ

### **2. Nice-to-Have Missing**
- **About Us Page** - Company information
- **Contact Page** - Contact information
- **Blog/Resources Page** - Educational content
- **Admin Dashboard** - Content management

## **🛠️ INTEGRATION GAPS**

### **1. Intake Layer Integration**
```typescript
// Current: Demo only
/demo-intake → Standalone demo

// Should be: Integrated
/reco → Intake Form → Wizard → Results
```

### **2. User Context Integration**
```typescript
// Current: Basic user context
UserProvider → Basic user state

// Should be: Full user management
UserProvider → Profile → Settings → Dashboard
```

### **3. Payment Integration**
```typescript
// Current: Basic Stripe integration
/confirm → /checkout → /thank-you

// Should be: Full e-commerce
/pricing → /confirm → /checkout → /thank-you → /dashboard
```

## **🎯 RECOMMENDATIONS**

### **Immediate Fixes (High Priority)**
1. **Connect intake layer** to main recommendation flow
2. **Add navigation** from landing page to recommendation wizard
3. **Integrate pricing** with confirmation flow
4. **Add user profile** management

### **Medium Priority**
1. **Create dashboard** for logged-in users
2. **Add program details** pages
3. **Implement help/support** system
4. **Add legal/privacy** page links

### **Low Priority**
1. **Create admin dashboard**
2. **Add blog/resources** section
3. **Implement advanced** user features

## **📊 CURRENT STATUS**

### **✅ WORKING FLOWS**
- Recommendation wizard → Results → Plan creation
- Editor → Export → Success page
- Payment confirmation flow
- Basic user onboarding

### **❌ BROKEN/MISSING FLOWS**
- Intake layer integration
- Pricing integration
- User profile management
- Navigation between main sections

### **📈 COMPLETION STATUS**
- **Core Flow**: 80% complete
- **User Management**: 20% complete
- **E-commerce**: 60% complete
- **Content Pages**: 40% complete

**Overall: 60% complete with critical gaps in user management and intake integration**
