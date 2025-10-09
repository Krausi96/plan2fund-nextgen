#!/usr/bin/env python3
"""
Safe Restructure Script - Step-by-step folder reorganization with import fixes
Ensures no breaking changes during the restructuring process
"""

import os
import shutil
import re
import json
from pathlib import Path

def create_backup():
    """Create a backup before starting"""
    print("📦 Creating backup...")
    try:
        os.system("git add .")
        os.system("git commit -m 'Backup before safe restructuring'")
        print("✅ Backup created successfully")
        return True
    except Exception as e:
        print(f"❌ Backup failed: {e}")
        return False

def create_folder_structure():
    """Create the new folder structure"""
    print("📁 Creating new folder structure...")
    
    folders_to_create = [
        "pages/marketing",
        "pages/user-flow", 
        "pages/checkout",
        "pages/legal",
        "pages/admin",
        "src/lib/api",
        "src/lib/ai",
        "src/lib/data",
        "src/lib/export",
        "src/lib/editor",
        "src/lib/recommendation",
        "src/lib/utils",
        "src/lib/business",
        "src/lib/scraper"
    ]
    
    for folder in folders_to_create:
        try:
            os.makedirs(folder, exist_ok=True)
            print(f"✅ Created: {folder}")
        except Exception as e:
            print(f"❌ Failed to create {folder}: {e}")
            return False
    
    return True

def move_pages():
    """Move pages to appropriate folders"""
    print("📄 Moving pages...")
    
    page_moves = {
        "pages/index.tsx": "pages/marketing/index.tsx",
        "pages/about.tsx": "pages/marketing/about.tsx",
        "pages/pricing.tsx": "pages/marketing/pricing.tsx",
        "pages/contact.tsx": "pages/marketing/contact.tsx",
        "pages/faq.tsx": "pages/marketing/faq.tsx",
        "pages/for.tsx": "pages/marketing/for.tsx",
        "pages/reco.tsx": "pages/user-flow/reco.tsx",
        "pages/results.tsx": "pages/user-flow/results.tsx",
        "pages/editor.tsx": "pages/user-flow/editor.tsx",
        "pages/optimized-editor.tsx": "pages/user-flow/optimized-editor.tsx",
        "pages/preview.tsx": "pages/user-flow/preview.tsx",
        "pages/checkout.tsx": "pages/checkout/checkout.tsx",
        "pages/confirm.tsx": "pages/checkout/confirm.tsx",
        "pages/thank-you.tsx": "pages/checkout/thank-you.tsx",
        "pages/privacy.tsx": "pages/legal/privacy.tsx",
        "pages/terms.tsx": "pages/legal/terms.tsx",
        "pages/legal.tsx": "pages/legal/legal.tsx",
        "pages/privacy-settings.tsx": "pages/legal/privacy-settings.tsx",
        "pages/dashboard.tsx": "pages/admin/dashboard.tsx",
        "pages/library.tsx": "pages/admin/library.tsx",
        "pages/export.tsx": "pages/admin/export.tsx",
        "pages/advanced-search.tsx": "pages/admin/advanced-search.tsx"
    }
    
    for old_path, new_path in page_moves.items():
        if os.path.exists(old_path):
            try:
                shutil.move(old_path, new_path)
                print(f"✅ Moved: {old_path} → {new_path}")
            except Exception as e:
                print(f"❌ Failed to move {old_path}: {e}")
                return False
        else:
            print(f"⚠️  File not found: {old_path}")
    
    return True

def move_lib_files():
    """Move lib files to appropriate folders"""
    print("📚 Moving lib files...")
    
    lib_moves = {
        # API files
        "src/lib/apiClient.ts": "src/lib/api/apiClient.ts",
        "src/lib/endpoints.ts": "src/lib/api/endpoints.ts",
        "src/lib/airtable.ts": "src/lib/api/airtable.ts",
        "src/lib/database.ts": "src/lib/api/database.ts",
        
        # AI files
        "src/lib/aiService.ts": "src/lib/ai/aiService.ts",
        "src/lib/aiHelper.ts": "src/lib/ai/aiHelper.ts",
        "src/lib/aiHelperGuardrails.ts": "src/lib/ai/aiHelperGuardrails.ts",
        "src/lib/aiChipParser.ts": "src/lib/ai/aiChipParser.ts",
        "src/lib/enhancedRecoEngine.ts": "src/lib/ai/enhancedRecoEngine.ts",
        
        # Data files
        "src/lib/dataSource.ts": "src/lib/data/dataSource.ts",
        "src/lib/sourceRegister.ts": "src/lib/data/sourceRegister.ts",
        "src/lib/ScrapedProgram.ts": "src/lib/data/ScrapedProgram.ts",
        "src/lib/libraryExtractor.ts": "src/lib/data/libraryExtractor.ts",
        
        # Export files
        "src/lib/export.ts": "src/lib/export/export.ts",
        "src/lib/comprehensiveExport.ts": "src/lib/export/comprehensiveExport.ts",
        "src/lib/submissionPack.ts": "src/lib/export/submissionPack.ts",
        
        # Editor files
        "src/lib/editorTemplates.ts": "src/lib/editor/editorTemplates.ts",
        "src/lib/programTemplates.ts": "src/lib/editor/programTemplates.ts",
        "src/lib/requirementsExtractor.ts": "src/lib/editor/requirementsExtractor.ts",
        "src/lib/requirementsMapper.ts": "src/lib/editor/requirementsMapper.ts",
        "src/lib/intakeParser.ts": "src/lib/editor/intakeParser.ts",
        "src/lib/prefill.ts": "src/lib/editor/prefill.ts",
        
        # Recommendation files
        "src/lib/decisionTree.ts": "src/lib/recommendation/decisionTree.ts",
        "src/lib/decisionTreeParser.ts": "src/lib/recommendation/decisionTreeParser.ts",
        "src/lib/dynamicDecisionTree.ts": "src/lib/recommendation/dynamicDecisionTree.ts",
        "src/lib/dynamicQuestionEngine.ts": "src/lib/recommendation/dynamicQuestionEngine.ts",
        "src/lib/enhancedDecisionTree.ts": "src/lib/recommendation/enhancedDecisionTree.ts",
        "src/lib/doctorDiagnostic.ts": "src/lib/recommendation/doctorDiagnostic.ts",
        "src/lib/advancedSearchDoctor.ts": "src/lib/recommendation/advancedSearchDoctor.ts",
        "src/lib/targetGroupDetection.ts": "src/lib/recommendation/targetGroupDetection.ts",
        
        # Utils files
        "src/lib/utils.ts": "src/lib/utils/utils.ts",
        "src/lib/motion.ts": "src/lib/utils/motion.ts",
        "src/lib/theme.ts": "src/lib/utils/theme.ts",
        "src/lib/seo.ts": "src/lib/utils/seo.ts",
        "src/lib/translationValidator.ts": "src/lib/utils/translationValidator.ts",
        
        # Business files
        "src/lib/pricing.ts": "src/lib/business/pricing.ts",
        "src/lib/payments.ts": "src/lib/business/payments.ts",
        "src/lib/financialCalculator.ts": "src/lib/business/financialCalculator.ts",
        "src/lib/planStore.ts": "src/lib/business/planStore.ts",
        "src/lib/multiUserDataManager.ts": "src/lib/business/multiUserDataManager.ts",
        "src/lib/teamManagement.ts": "src/lib/business/teamManagement.ts",
        "src/lib/addons.ts": "src/lib/business/addons.ts",
        
        # Scraper files
        "src/lib/webScraperService.ts": "src/lib/scraper/webScraperService.ts",
        "src/lib/enhancedDataPipeline.ts": "src/lib/scraper/enhancedDataPipeline.ts"
    }
    
    for old_path, new_path in lib_moves.items():
        if os.path.exists(old_path):
            try:
                shutil.move(old_path, new_path)
                print(f"✅ Moved: {old_path} → {new_path}")
            except Exception as e:
                print(f"❌ Failed to move {old_path}: {e}")
                return False
        else:
            print(f"⚠️  File not found: {old_path}")
    
    return True

def update_imports():
    """Update all import statements to reflect new structure"""
    print("🔧 Updating import statements...")
    
    # Import replacements
    import_replacements = {
        # Lib imports
        "@/lib/apiClient": "@/lib/api/apiClient",
        "@/lib/endpoints": "@/lib/api/endpoints", 
        "@/lib/airtable": "@/lib/api/airtable",
        "@/lib/database": "@/lib/api/database",
        "@/lib/aiService": "@/lib/ai/aiService",
        "@/lib/aiHelper": "@/lib/ai/aiHelper",
        "@/lib/aiHelperGuardrails": "@/lib/ai/aiHelperGuardrails",
        "@/lib/aiChipParser": "@/lib/ai/aiChipParser",
        "@/lib/enhancedRecoEngine": "@/lib/ai/enhancedRecoEngine",
        "@/lib/dataSource": "@/lib/data/dataSource",
        "@/lib/sourceRegister": "@/lib/data/sourceRegister",
        "@/lib/ScrapedProgram": "@/lib/data/ScrapedProgram",
        "@/lib/libraryExtractor": "@/lib/data/libraryExtractor",
        "@/lib/export": "@/lib/export/export",
        "@/lib/comprehensiveExport": "@/lib/export/comprehensiveExport",
        "@/lib/submissionPack": "@/lib/export/submissionPack",
        "@/lib/editorTemplates": "@/lib/editor/editorTemplates",
        "@/lib/programTemplates": "@/lib/editor/programTemplates",
        "@/lib/requirementsExtractor": "@/lib/editor/requirementsExtractor",
        "@/lib/requirementsMapper": "@/lib/editor/requirementsMapper",
        "@/lib/intakeParser": "@/lib/editor/intakeParser",
        "@/lib/prefill": "@/lib/editor/prefill",
        "@/lib/decisionTree": "@/lib/recommendation/decisionTree",
        "@/lib/decisionTreeParser": "@/lib/recommendation/decisionTreeParser",
        "@/lib/dynamicDecisionTree": "@/lib/recommendation/dynamicDecisionTree",
        "@/lib/dynamicQuestionEngine": "@/lib/recommendation/dynamicQuestionEngine",
        "@/lib/enhancedDecisionTree": "@/lib/recommendation/enhancedDecisionTree",
        "@/lib/doctorDiagnostic": "@/lib/recommendation/doctorDiagnostic",
        "@/lib/advancedSearchDoctor": "@/lib/recommendation/advancedSearchDoctor",
        "@/lib/targetGroupDetection": "@/lib/recommendation/targetGroupDetection",
        "@/lib/utils": "@/lib/utils/utils",
        "@/lib/motion": "@/lib/utils/motion",
        "@/lib/theme": "@/lib/utils/theme",
        "@/lib/seo": "@/lib/utils/seo",
        "@/lib/translationValidator": "@/lib/utils/translationValidator",
        "@/lib/pricing": "@/lib/business/pricing",
        "@/lib/payments": "@/lib/business/payments",
        "@/lib/financialCalculator": "@/lib/business/financialCalculator",
        "@/lib/planStore": "@/lib/business/planStore",
        "@/lib/multiUserDataManager": "@/lib/business/multiUserDataManager",
        "@/lib/teamManagement": "@/lib/business/teamManagement",
        "@/lib/addons": "@/lib/business/addons",
        "@/lib/webScraperService": "@/lib/scraper/webScraperService",
        "@/lib/enhancedDataPipeline": "@/lib/scraper/enhancedDataPipeline"
    }
    
    # Find all files that need updating
    files_to_update = []
    for root, dirs, files in os.walk("."):
        if "node_modules" in root or ".next" in root:
            continue
        for file in files:
            if file.endswith(('.ts', '.tsx', '.js', '.jsx')):
                files_to_update.append(os.path.join(root, file))
    
    # Update each file
    updated_files = 0
    for file_path in files_to_update:
        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                content = f.read()
            
            original_content = content
            
            # Apply replacements
            for old_import, new_import in import_replacements.items():
                content = content.replace(old_import, new_import)
            
            # Only write if content changed
            if content != original_content:
                with open(file_path, 'w', encoding='utf-8') as f:
                    f.write(content)
                updated_files += 1
                print(f"✅ Updated imports in: {file_path}")
                
        except Exception as e:
            print(f"❌ Error updating {file_path}: {e}")
    
    print(f"✅ Updated {updated_files} files")
    return True

def test_compilation():
    """Test that everything compiles correctly"""
    print("🧪 Testing compilation...")
    try:
        result = os.system("npx tsc --noEmit")
        if result == 0:
            print("✅ Compilation successful!")
            return True
        else:
            print("❌ Compilation failed!")
            return False
    except Exception as e:
        print(f"❌ Compilation test failed: {e}")
        return False

def main():
    print("🚀 STARTING SAFE RESTRUCTURE")
    print("=" * 50)
    
    # Step 1: Create backup
    if not create_backup():
        print("❌ Backup failed, aborting...")
        return
    
    # Step 2: Create folder structure
    if not create_folder_structure():
        print("❌ Folder creation failed, aborting...")
        return
    
    # Step 3: Move pages
    if not move_pages():
        print("❌ Page moving failed, aborting...")
        return
    
    # Step 4: Move lib files
    if not move_lib_files():
        print("❌ Lib file moving failed, aborting...")
        return
    
    # Step 5: Update imports
    if not update_imports():
        print("❌ Import updating failed, aborting...")
        return
    
    # Step 6: Test compilation
    if not test_compilation():
        print("❌ Compilation test failed!")
        print("You may need to fix some imports manually.")
        return
    
    print("\n🎉 RESTRUCTURE COMPLETE!")
    print("✅ All files moved successfully")
    print("✅ All imports updated")
    print("✅ Compilation successful")
    print("\n📋 Next steps:")
    print("1. Test the application: npm run dev")
    print("2. Check all functionality works")
    print("3. Commit the changes: git add . && git commit -m 'Restructured folders'")

if __name__ == "__main__":
    main()
