# 🔄 MIGRATION GUIDE
**Complete Import Path Migration & File Structure Guide**

**Last Updated**: January 16, 2025  
**Status**: 📋 **PLANNING PHASE** - Ready for Execution

---

## 🎯 MIGRATION OVERVIEW

This guide provides the complete mapping from the current codebase structure to the new layered architecture. Use this as your reference during the migration process.

---

## 🔄 IMPORT PATH MIGRATION REFERENCE

### **Current Structure → New Architecture Mapping**

#### **LAYER 1: APP LAYER (Pages & Components)**
| **Current Path** | **New Path** | **Files** | **Status** |
|------------------|--------------|-----------|------------|
| `@/pages/` | `@/app/pages/` | ~30 files | [ ] |
| `@/pages/api/` | `@/app/api/` | ~30 files | [ ] |
| `@/components/` | `@/app/components/` | ~88 files | [ ] |
| `@/components/editor/` | `@/app/components/editor/` | ~18 files | [ ] |
| `@/components/pricing/` | `@/app/components/pricing/` | ~11 files | [ ] |
| `@/components/layout/` | `@/app/components/ui/layout/` | ~7 files | [ ] |
| `@/components/ui/` | `@/app/components/ui/primitives/` | ~9 files | [ ] |

#### **LAYER 2: CORE LAYER (Business Logic)**
| **Current Path** | **New Path** | **Files** | **Status** |
|------------------|--------------|-----------|------------|
| `@/lib/` | `@/core/` | ~100 files | [ ] |
| `@/lib/validation/` | `@/core/processing/validation/` | ~2 files | [ ] |
| `@/lib/templates/` | `@/core/templates/` | ~15 files | [ ] |
| `@/lib/editor/` | `@/core/editor/` | ~2 files | [ ] |
| `@/reco/` | `@/core/processing/recommendation/` | ~1 file | [ ] |

#### **LAYER 3: DATA LAYER (Database & Storage)**
| **Current Path** | **New Path** | **Files** | **Status** |
|------------------|--------------|-----------|------------|
| `@/data/` | `@/data/static/` | ~15 files | [ ] |
| `@/lib/database` | `@/data/database/` | ~20 files | [ ] |
| `@/lib/schemas/` | `@/data/database/schemas/` | ~3 files | [ ] |

#### **LAYER 4: SHARED LAYER (Types & Utilities)**
| **Current Path** | **New Path** | **Files** | **Status** |
|------------------|--------------|-----------|------------|
| `@/types/` | `@/shared/types/` | ~15 files | [ ] |
| `@/contexts/` | `@/shared/state-management/contexts/` | ~3 files | [ ] |
| `@/hooks/` | `@/shared/state-management/hooks/` | ~2 files | [ ] |
| `@/lib/utils` | `@/shared/utilities/general/` | ~2 files | [ ] |
| `@/i18n/` | `@/shared/i18n/` | ~3 files | [ ] |

#### **LAYER 5: CONFIG LAYER (Configuration)**
| **Current Path** | **New Path** | **Files** | **Status** |
|------------------|--------------|-----------|------------|
| No changes | No changes | ~60 files | [ ] |

#### **LAYER 6: ASSETS LAYER (Static Assets)**
| **Current Path** | **New Path** | **Files** | **Status** |
|------------------|--------------|-----------|------------|
| `@/styles/` | `@/assets/styles/` | ~1 file | [ ] |
| `@/public/` | `@/assets/public/` | ~4 files | [ ] |

---

## 🛠️ TSCONFIG.JSON PATHS UPDATE

The `tsconfig.json` file will need to be updated to reflect these new base URLs and paths.

```json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": [
        "app/*",
        "core/*",
        "data/*",
        "shared/*",
        "config/*",
        "assets/*"
      ],
      "@/app/*": ["app/*"],
      "@/core/*": ["core/*"],
      "@/data/*": ["data/*"],
      "@/shared/*": ["shared/*"],
      "@/config/*": ["config/*"],
      "@/assets/*": ["assets/*"]
    }
  }
}
```

---

## 🚀 MIGRATION EXECUTION PLAN

### **Phase 1: Function Review & Cleanup**
1. [ ] Review all functions in critical files (webScraperService.ts, enhancedDataPipeline.ts, enhancedRecoEngine.ts)
2. [ ] Mark deprecated functions for removal
3. [ ] Remove unused functions and console logging
4. [ ] Test build after cleanup

### **Phase 2: Import Path Migration**
1. [ ] Update tsconfig.json with new path mappings
2. [ ] Run automated import update script
3. [ ] Test build with new import paths

### **Phase 3: File Structure Migration**
1. [ ] **Shared Layer**: Move types, contexts, hooks, utils
2. [ ] **Data Layer**: Move data files, database logic  
3. [ ] **Core Layer**: Move business logic, templates
4. [ ] **App Layer**: Move components, pages, API routes
5. [ ] **Assets Layer**: Move styles, public files

### **Phase 4: Verification**
1. [ ] All imports resolve correctly
2. [ ] Build succeeds: `npm run build`
3. [ ] No TypeScript errors
4. [ ] All functionality works

---

## 📋 MIGRATION CHECKLIST

### **Pre-Migration**
- [ ] Create backup branch: `git checkout -b migration-backup`
- [ ] Review all function documentation in MASTER_SYSTEM_DOCS.md
- [ ] Identify critical functions that must not be removed
- [ ] Plan migration order (start with least critical files)

### **During Migration**
- [ ] Update one layer at a time
- [ ] Test build after each layer migration
- [ ] Update import statements systematically
- [ ] Verify all functionality works

### **Post-Migration**
- [ ] Run full test suite
- [ ] Performance testing
- [ ] Documentation update
- [ ] Team review and approval

---

## ⚠️ CRITICAL NOTES

1. **Never migrate all files at once** - Do it layer by layer
2. **Always test after each step** - Build must succeed before continuing
3. **Keep backups** - Create backup branches before major changes
4. **Document changes** - Update this guide as you progress
5. **Team coordination** - Ensure team is aware of migration progress

---

**This migration guide should be used alongside the MASTER_SYSTEM_DOCS.md for complete system understanding.**
