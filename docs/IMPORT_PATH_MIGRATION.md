# 🔄 IMPORT PATH MIGRATION REFERENCE
**Current Structure → New Architecture Import Mapping**

**Current Files**: ~180 source files  
**Target Architecture**: 6-layer structure (330 files)  
**Purpose**: Import path transformation during migration

---

## 📊 CURRENT STRUCTURE ANALYSIS

### **Current Import Patterns Found:**
```typescript
// Current imports in codebase
import { something } from '@/lib/...'
import { something } from '@/components/...'
import { something } from '@/pages/...'
import { something } from '@/types/...'
import { something } from '@/contexts/...'
import { something } from '@/hooks/...'
import { something } from '@/data/...'
import { something } from '@/i18n/...'
```

---

## 🎯 LAYER-BY-LAYER MIGRATION MAPPING

### **LAYER 1: APP LAYER (Pages & Components)**

| **Current Path** | **New Path** | **Files Affected** | **Purpose** |
|------------------|--------------|-------------------|-------------|
| `@/pages/` | `@/app/pages/` | ~30 files | All page components |
| `@/pages/api/` | `@/app/api/` | ~30 files | API routes |
| `@/components/` | `@/app/components/` | ~88 files | All components |
| `@/components/editor/` | `@/app/components/editor/` | ~18 files | Editor components |
| `@/components/pricing/` | `@/app/components/pricing/` | ~11 files | Pricing components |
| `@/components/layout/` | `@/app/components/ui/layout/` | ~7 files | Layout components |
| `@/components/ui/` | `@/app/components/ui/primitives/` | ~9 files | UI primitives |

### **LAYER 2: CORE LAYER (Business Logic)**

| **Current Path** | **New Path** | **Files Affected** | **Purpose** |
|------------------|--------------|-------------------|-------------|
| `@/lib/` | `@/core/` | ~100 files | Main business logic |
| `@/lib/validation/` | `@/core/processing/validation/` | ~2 files | Validation logic |
| `@/lib/templates/` | `@/core/templates/` | ~15 files | Template system |
| `@/lib/editor/` | `@/core/editor/` | ~2 files | Editor logic |
| `@/reco/` | `@/core/processing/recommendation/` | ~1 file | Recommendation logic |

### **LAYER 3: DATA LAYER (Database & Storage)**

| **Current Path** | **New Path** | **Files Affected** | **Purpose** |
|------------------|--------------|-------------------|-------------|
| `@/data/` | `@/data/static/` | ~15 files | Static data files |
| `@/lib/database` | `@/data/database/` | ~20 files | Database logic |
| `@/lib/schemas/` | `@/data/database/schemas/` | ~3 files | Database schemas |

### **LAYER 4: SHARED LAYER (Types & Utilities)**

| **Current Path** | **New Path** | **Files Affected** | **Purpose** |
|------------------|--------------|-------------------|-------------|
| `@/types/` | `@/shared/types/` | ~15 files | Type definitions |
| `@/contexts/` | `@/shared/state-management/contexts/` | ~3 files | React contexts |
| `@/hooks/` | `@/shared/state-management/hooks/` | ~2 files | Custom hooks |
| `@/lib/utils` | `@/shared/utilities/general/` | ~2 files | General utilities |
| `@/i18n/` | `@/shared/i18n/` | ~3 files | Internationalization |

### **LAYER 5: CONFIG LAYER (Configuration)**

| **Current Path** | **New Path** | **Files Affected** | **Purpose** |
|------------------|--------------|-------------------|-------------|
| No changes | No changes | ~60 files | Build config, scripts, docs |

### **LAYER 6: ASSETS LAYER (Static Assets)**

| **Current Path** | **New Path** | **Files Affected** | **Purpose** |
|------------------|--------------|-------------------|-------------|
| `@/styles/` | `@/assets/styles/` | ~1 file | Global styles |
| `@/public/` | `@/assets/public/` | ~4 files | Public assets |

---

## 🔧 AUTOMATED MIGRATION SCRIPT

### **tsconfig.json Update (Required First)**
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

### **Import Update Script**
```javascript
// scripts/update-imports.js
const fs = require('fs');
const path = require('path');

const importMappings = {
  // App Layer
  '@/pages/': '@/app/pages/',
  '@/pages/api/': '@/app/api/',
  '@/components/': '@/app/components/',
  '@/components/editor/': '@/app/components/editor/',
  '@/components/pricing/': '@/app/components/pricing/',
  '@/components/layout/': '@/app/components/ui/layout/',
  '@/components/ui/': '@/app/components/ui/primitives/',
  
  // Core Layer
  '@/lib/': '@/core/',
  '@/lib/validation/': '@/core/processing/validation/',
  '@/lib/templates/': '@/core/templates/',
  '@/lib/editor/': '@/core/editor/',
  '@/reco/': '@/core/processing/recommendation/',
  
  // Data Layer
  '@/data/': '@/data/static/',
  '@/lib/database': '@/data/database/',
  '@/lib/schemas/': '@/data/database/schemas/',
  
  // Shared Layer
  '@/types/': '@/shared/types/',
  '@/contexts/': '@/shared/state-management/contexts/',
  '@/hooks/': '@/shared/state-management/hooks/',
  '@/lib/utils': '@/shared/utilities/general/',
  '@/i18n/': '@/shared/i18n/',
  
  // Assets Layer
  '@/styles/': '@/assets/styles/',
  '@/public/': '@/assets/public/'
};

function updateImportsInFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  
  Object.entries(importMappings).forEach(([oldPath, newPath]) => {
    const regex = new RegExp(oldPath.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g');
    content = content.replace(regex, newPath);
  });
  
  fs.writeFileSync(filePath, content);
}

// Run on all TypeScript/JavaScript files
function updateAllImports(dir) {
  const files = fs.readdirSync(dir);
  
  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory() && !file.startsWith('.') && file !== 'node_modules') {
      updateAllImports(filePath);
    } else if (file.endsWith('.ts') || file.endsWith('.tsx') || file.endsWith('.js') || file.endsWith('.jsx')) {
      updateImportsInFile(filePath);
    }
  });
}

updateAllImports('./');
console.log('Import paths updated successfully!');
```

---

## 📋 MIGRATION CHECKLIST

### **Phase 1: Preparation**
- [ ] Update `tsconfig.json` with new paths
- [ ] Create new folder structure
- [ ] Run import update script
- [ ] Test build: `npm run build`

### **Phase 2: File Migration (One Layer at a Time)**
- [ ] **Shared Layer**: Move types, contexts, hooks, utils
- [ ] **Data Layer**: Move data files, database logic
- [ ] **Core Layer**: Move business logic, templates
- [ ] **App Layer**: Move components, pages, API routes
- [ ] **Assets Layer**: Move styles, public files

### **Phase 3: Verification**
- [ ] All imports resolve correctly
- [ ] Build succeeds: `npm run build`
- [ ] No TypeScript errors
- [ ] All functionality works

---

## ⚠️ CRITICAL WARNINGS

1. **Update tsconfig.json FIRST** - before any file moves
2. **Test after each layer** - don't continue if build fails
3. **Use `git mv` commands** - never regular move commands
4. **Commit after each successful layer** - don't lose progress
5. **Run import script after each major change** - keep imports updated

---

## 🎯 SUCCESS METRICS

- **Build status**: ✅ `npm run build` succeeds
- **Import errors**: 0 TypeScript import errors
- **File count**: All 180 files migrated to new structure
- **Functionality**: All features working in new structure

**This is your import migration bible - follow it step by step!**
