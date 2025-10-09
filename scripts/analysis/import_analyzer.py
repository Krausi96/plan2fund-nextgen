#!/usr/bin/env python3
"""
Import Analyzer - Analyze current import structure before restructuring
Ensures we don't break imports when reorganizing folders
"""

import os
import re
import json
from pathlib import Path

def analyze_imports():
    """Analyze all import statements in the codebase"""
    
    results = {
        "import_patterns": {},
        "critical_imports": [],
        "relative_imports": [],
        "absolute_imports": [],
        "potential_breaking_changes": [],
        "import_map": {}
    }
    
    # Patterns to find different types of imports
    import_patterns = {
        "relative_imports": r"import\s+.*from\s+['\"]\.\.?/",
        "absolute_imports": r"import\s+.*from\s+['\"]@/",
        "lib_imports": r"import\s+.*from\s+['\"]@/lib/",
        "component_imports": r"import\s+.*from\s+['\"]@/components/",
        "page_imports": r"import\s+.*from\s+['\"]\.\.?/pages/",
        "api_imports": r"import\s+.*from\s+['\"]\.\.?/api/"
    }
    
    # Files to analyze
    files_to_analyze = []
    
    # Find all TypeScript/JavaScript files
    for root, dirs, files in os.walk("."):
        # Skip node_modules and .next
        if "node_modules" in root or ".next" in root:
            continue
            
        for file in files:
            if file.endswith(('.ts', '.tsx', '.js', '.jsx')):
                files_to_analyze.append(os.path.join(root, file))
    
    print(f"🔍 Analyzing {len(files_to_analyze)} files for import patterns...")
    
    # Analyze each file
    for file_path in files_to_analyze:
        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                content = f.read()
                
            # Find all import statements
            import_lines = re.findall(r"import\s+.*from\s+['\"][^'\"]+['\"]", content)
            
            for import_line in import_lines:
                # Extract the import path
                import_match = re.search(r"from\s+['\"]([^'\"]+)['\"]", import_line)
                if import_match:
                    import_path = import_match.group(1)
                    
                    # Categorize the import
                    if import_path.startswith('@/'):
                        results["absolute_imports"].append({
                            "file": file_path,
                            "import": import_line,
                            "path": import_path
                        })
                        
                        # Track lib imports specifically
                        if import_path.startswith('@/lib/'):
                            lib_file = import_path.replace('@/lib/', 'src/lib/')
                            if lib_file not in results["import_map"]:
                                results["import_map"][lib_file] = []
                            results["import_map"][lib_file].append(file_path)
                            
                    elif import_path.startswith('./') or import_path.startswith('../'):
                        results["relative_imports"].append({
                            "file": file_path,
                            "import": import_line,
                            "path": import_path
                        })
                        
                        # Check if it's importing from pages
                        if '/pages/' in import_path or import_path.startswith('pages/'):
                            results["potential_breaking_changes"].append({
                                "file": file_path,
                                "import": import_line,
                                "path": import_path,
                                "issue": "Page import that will break after restructuring"
                            })
    
        except Exception as e:
            print(f"❌ Error analyzing {file_path}: {e}")
    
    # Analyze import patterns
    for pattern_name, pattern in import_patterns.items():
        count = 0
        for file_path in files_to_analyze:
            try:
                with open(file_path, 'r', encoding='utf-8') as f:
                    content = f.read()
                    matches = re.findall(pattern, content)
                    count += len(matches)
            except:
                pass
        results["import_patterns"][pattern_name] = count
    
    # Find critical imports that will break
    critical_files = [
        "pages/_app.tsx",
        "pages/index.tsx", 
        "pages/reco.tsx",
        "pages/editor.tsx",
        "src/components/editor/StructuredEditor.tsx",
        "src/components/reco/UnifiedRecommendationWizard.tsx"
    ]
    
    for file_path in critical_files:
        if os.path.exists(file_path):
            try:
                with open(file_path, 'r', encoding='utf-8') as f:
                    content = f.read()
                    
                # Find all imports
                imports = re.findall(r"import\s+.*from\s+['\"][^'\"]+['\"]", content)
                
                for import_line in imports:
                    if 'pages/' in import_line or '@/lib/' in import_line:
                        results["critical_imports"].append({
                            "file": file_path,
                            "import": import_line
                        })
            except Exception as e:
                print(f"❌ Error analyzing critical file {file_path}: {e}")
    
    return results

def create_import_fix_plan(analysis_results):
    """Create a plan to fix imports after restructuring"""
    
    plan = {
        "steps": [],
        "files_to_update": {},
        "import_replacements": {},
        "risks": []
    }
    
    # Step 1: Update lib imports
    lib_mappings = {
        "src/lib/apiClient.ts": "src/lib/api/apiClient.ts",
        "src/lib/aiService.ts": "src/lib/ai/aiService.ts",
        "src/lib/dataSource.ts": "src/lib/data/dataSource.ts",
        "src/lib/export.ts": "src/lib/export/export.ts",
        "src/lib/editorTemplates.ts": "src/lib/editor/editorTemplates.ts",
        "src/lib/decisionTree.ts": "src/lib/recommendation/decisionTree.ts",
        "src/lib/utils.ts": "src/lib/utils/utils.ts",
        "src/lib/pricing.ts": "src/lib/business/pricing.ts",
        "src/lib/webScraperService.ts": "src/lib/scraper/webScraperService.ts"
    }
    
    # Create import replacements
    for old_path, new_path in lib_mappings.items():
        old_import = f"@/lib/{os.path.basename(old_path).replace('.ts', '')}"
        new_import = f"@/lib/{new_path.replace('src/lib/', '').replace('.ts', '')}"
        
        plan["import_replacements"][old_import] = new_import
    
    # Step 2: Update page imports
    page_mappings = {
        "pages/index.tsx": "pages/marketing/index.tsx",
        "pages/about.tsx": "pages/marketing/about.tsx",
        "pages/pricing.tsx": "pages/marketing/pricing.tsx",
        "pages/reco.tsx": "pages/user-flow/reco.tsx",
        "pages/results.tsx": "pages/user-flow/results.tsx",
        "pages/editor.tsx": "pages/user-flow/editor.tsx"
    }
    
    for old_path, new_path in page_mappings.items():
        old_import = f"./{os.path.basename(old_path).replace('.tsx', '')}"
        new_import = f"./{new_path.replace('pages/', '')}"
        
        plan["import_replacements"][old_import] = new_import
    
    # Step 3: Create update steps
    plan["steps"] = [
        {
            "step": 1,
            "action": "Create backup of current structure",
            "command": "git add . && git commit -m 'Backup before restructuring'"
        },
        {
            "step": 2,
            "action": "Create new folder structure",
            "description": "Create all new directories"
        },
        {
            "step": 3,
            "action": "Move files to new locations",
            "description": "Move files according to the plan"
        },
        {
            "step": 4,
            "action": "Update import statements",
            "description": "Use automated replacement for all imports"
        },
        {
            "step": 5,
            "action": "Test compilation",
            "command": "npx tsc --noEmit"
        },
        {
            "step": 6,
            "action": "Test functionality",
            "command": "npm run dev"
        }
    ]
    
    # Identify risks
    plan["risks"] = [
        "Breaking changes in relative imports",
        "Next.js routing may break with page moves",
        "Component imports may break",
        "API route imports may break"
    ]
    
    return plan

def main():
    print("🔍 ANALYZING IMPORT STRUCTURE")
    print("=" * 50)
    
    # Analyze current imports
    analysis = analyze_imports()
    
    # Save analysis
    with open("import_analysis.json", "w") as f:
        json.dump(analysis, f, indent=2)
    
    print(f"✅ Analysis complete!")
    print(f"📊 Found {len(analysis['absolute_imports'])} absolute imports")
    print(f"📊 Found {len(analysis['relative_imports'])} relative imports")
    print(f"📊 Found {len(analysis['potential_breaking_changes'])} potential breaking changes")
    print(f"📊 Found {len(analysis['critical_imports'])} critical imports")
    
    # Create fix plan
    fix_plan = create_import_fix_plan(analysis)
    
    # Save fix plan
    with open("import_fix_plan.json", "w") as f:
        json.dump(fix_plan, f, indent=2)
    
    print(f"📄 Analysis saved to: import_analysis.json")
    print(f"📄 Fix plan saved to: import_fix_plan.json")
    
    if analysis['potential_breaking_changes']:
        print(f"\n⚠️  WARNING: {len(analysis['potential_breaking_changes'])} potential breaking changes found!")
        print("Review import_fix_plan.json before proceeding with restructuring.")

if __name__ == "__main__":
    main()
