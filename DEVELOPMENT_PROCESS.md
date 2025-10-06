# 🚀 DEVELOPMENT PROCESS REMINDER

## ⚠️ **CRITICAL RULES - ALWAYS FOLLOW**

### **1. CHECK EXISTING FILES FIRST**
- **ALWAYS** check for existing files before creating new ones
- **ALWAYS** integrate into existing components rather than creating duplicates
- **ALWAYS** update existing files instead of creating new ones with similar functionality
- **NEVER** create files with names like "phase4-editor" - use descriptive names

### **2. NO DUPLICATES, NO DEAD FILES**
- **ALWAYS** check `list_dir` and `grep` for existing functionality
- **ALWAYS** integrate new features into existing components
- **ALWAYS** remove or refactor duplicate functionality
- **ALWAYS** clean up unused files after integration

### **3. PROPER INTEGRATION**
- **ALWAYS** wire everything correctly with existing systems
- **ALWAYS** maintain existing APIs and interfaces
- **ALWAYS** preserve existing functionality while adding new features
- **ALWAYS** test integration with existing components

### **4. CROSS-CHECK WITH MD FILES**
- **ALWAYS** read relevant MD files before implementing
- **ALWAYS** update MD files to reflect changes
- **ALWAYS** follow the rules specified in MD files
- **ALWAYS** maintain consistency with documented architecture

### **5. NAMING CONVENTIONS**
- Use descriptive names: `EnhancedEditor` not `Phase4Editor`
- Use existing patterns: `EditorShell`, `SectionEditor`, etc.
- Follow existing file structure and naming
- Avoid version numbers in file names

## 📋 **BEFORE EVERY COMMIT CHECKLIST**

1. ✅ **Check existing files** - `list_dir` and `grep` for similar functionality
2. ✅ **Integrate don't duplicate** - Update existing files instead of creating new ones
3. ✅ **Wire correctly** - Ensure all connections work with existing system
4. ✅ **Update MD files** - Reflect changes in documentation
5. ✅ **Test integration** - Verify everything works together
6. ✅ **Clean up** - Remove any unused or duplicate files

## 🎯 **CURRENT INTEGRATION TARGETS**

### **Editor Pages**
- `pages/editor.tsx` - Main editor (legacy)
- `pages/optimized-editor.tsx` - Performance optimized editor (TARGET FOR PHASE 4)

### **Editor Components**
- `src/editor/EditorShell.tsx` - Main editor shell
- `src/editor/optimized/OptimizedEditorShell.tsx` - Optimized shell (TARGET FOR PHASE 4)
- `src/components/editor/SectionEditor.tsx` - Section editor (ENHANCED)

### **Integration Strategy**
1. **Enhance existing `optimized-editor.tsx`** with Phase 4 features
2. **Update `OptimizedEditorShell.tsx`** with new navigation and features
3. **Enhance `SectionEditor.tsx`** with customization and uniqueness features
4. **Create supporting components** only if they don't exist
5. **Update documentation** to reflect integration

## 🚨 **REMEMBER**
- **INTEGRATE, DON'T DUPLICATE**
- **CHECK FIRST, CREATE SECOND**
- **WIRE EVERYTHING CORRECTLY**
- **UPDATE DOCUMENTATION**
- **NO DEAD FILES**
