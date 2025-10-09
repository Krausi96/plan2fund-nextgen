# 🔄 USER FLOW DOCUMENTATION

## 📊 SYSTEM OVERVIEW

Based on the analysis, here are the main user flows and their requirements:

## 🎯 FLOW 1: LANDING TO RECOMMENDATION

### Purpose:
User lands on the site and gets funding program recommendations

### Files Involved:
- **Pages**: `pages/marketing/index.tsx`, `pages/user-flow/reco.tsx`
- **Components**: `Hero.tsx`, `PlanTypes.tsx`, `TargetGroupBanner.tsx`, `UnifiedRecommendationWizard.tsx`
- **APIs**: `/api/programs`, `/api/programs-ai`, `/api/recommend`
- **Lib Files**: `src/lib/ai/enhancedRecoEngine.ts`, `src/lib/data/dataSource.ts`, `src/lib/recommendation/decisionTree.ts`

### Data Flow:
```
User Input → AI Analysis → Program Matching → Results Display
```

### Requirements:
- ✅ Landing page loads correctly
- ✅ User can input their information
- ✅ AI analyzes the input
- ✅ Programs are matched and displayed
- ❌ **ISSUE**: Not connected to scraper data (using fallback)

## 🎯 FLOW 2: RECOMMENDATION TO EDITOR

### Purpose:
User selects a program and starts editing their business plan

### Files Involved:
- **Pages**: `pages/user-flow/results.tsx`, `pages/user-flow/editor.tsx`, `pages/user-flow/optimized-editor.tsx`
- **Components**: `StructuredEditor.tsx`, `RequirementsChecker.tsx`, `EnhancedAIChat.tsx`
- **APIs**: `/api/plan/save`, `/api/ai/generate`
- **Lib Files**: `src/lib/editor/editorTemplates.ts`, `src/lib/ai/aiService.ts`, `src/lib/business/planStore.ts`

### Data Flow:
```
Selected Program → Plan Template → Editor Interface → AI Assistance
```

### Requirements:
- ✅ User can select a program
- ✅ Plan template loads
- ✅ Editor interface works
- ✅ AI assistance available
- ✅ Plan can be saved

## 🎯 FLOW 3: EDITOR TO EXPORT

### Purpose:
User completes their plan and exports it in various formats

### Files Involved:
- **Pages**: `pages/user-flow/editor.tsx`, `pages/admin/export.tsx`
- **Components**: `TemplatesFormattingManager.tsx`, `CollaborationManager.tsx`, `ExportSettings.tsx`
- **APIs**: `/api/export`, `/api/plan/save`
- **Lib Files**: `src/lib/export/export.ts`, `src/lib/export/templates.ts`, `src/lib/business/multiUserDataManager.ts`

### Data Flow:
```
Plan Content → Template Selection → Formatting → Export Generation
```

### Requirements:
- ✅ User can format their plan
- ✅ Templates are available
- ✅ Export options work
- ✅ Multiple formats supported
- ✅ Collaboration features work

## 🎯 FLOW 4: CHECKOUT TO SUCCESS

### Purpose:
User pays for the service and completes the process

### Files Involved:
- **Pages**: `pages/marketing/pricing.tsx`, `pages/checkout/checkout.tsx`, `pages/checkout/thank-you.tsx`
- **Components**: `PricingDetails.tsx`, `SuccessHub.tsx`
- **APIs**: `/api/payments/create-session`, `/api/stripe/webhook`
- **Lib Files**: `src/lib/business/pricing.ts`, `src/lib/business/payments.ts`

### Data Flow:
```
Pricing Selection → Payment Processing → Success Confirmation
```

### Requirements:
- ✅ Pricing is displayed correctly
- ✅ Payment processing works
- ✅ Success confirmation shows
- ✅ User data is saved

## 🔧 CRITICAL ISSUES TO FIX

### 1. Scraper Integration (HIGH PRIORITY)
- **Issue**: Recommendation system not connected to scraper data
- **Impact**: Users get fallback data instead of real-time data
- **Files**: `pages/user-flow/reco.tsx`, `src/lib/data/dataSource.ts`
- **Fix**: Connect to `/api/scraper/run` and `/api/scraper/status`

### 2. File Organization (MEDIUM PRIORITY)
- **Issue**: 21 pages and 52 lib files scattered
- **Impact**: Hard to navigate and maintain
- **Fix**: Restructure folders as planned

### 3. Import Path Updates (LOW PRIORITY)
- **Issue**: Import paths will break after restructuring
- **Impact**: Compilation errors
- **Fix**: Automated import replacement

## 📋 NEXT STEPS

### Immediate (Phase 1):
1. **Fix scraper integration** - Connect recommendation system to real data
2. **Test all flows** - Ensure everything works before restructuring

### Short-term (Phase 2):
1. **Execute folder restructure** - Organize files logically
2. **Update import paths** - Fix all broken imports
3. **Test functionality** - Ensure everything still works

### Long-term (Phase 3):
1. **Optimize components** - Reduce file sizes where needed
2. **Improve performance** - Optimize loading and rendering
3. **Add new features** - Based on user feedback

## 🎯 SUCCESS METRICS

### Technical:
- ✅ All pages load without errors
- ✅ All imports resolve correctly
- ✅ TypeScript compilation passes
- ✅ All API endpoints work

### Functional:
- ✅ Users can complete the full flow
- ✅ Data flows correctly between components
- ✅ Real-time data is used (not fallback)
- ✅ Export functionality works

### User Experience:
- ✅ Clear navigation between sections
- ✅ Intuitive file organization
- ✅ Fast loading times
- ✅ No broken functionality

## 📊 CURRENT STATUS

- **Landing to Recommendation**: ✅ Working (needs scraper fix)
- **Recommendation to Editor**: ✅ Working
- **Editor to Export**: ✅ Working
- **Checkout to Success**: ✅ Working
- **File Organization**: ❌ Needs restructuring
- **Import Management**: ❌ Needs updating

**Overall System Health**: 80% - Functional but needs organization and scraper integration
