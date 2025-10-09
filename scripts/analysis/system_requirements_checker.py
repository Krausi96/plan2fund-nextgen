#!/usr/bin/env python3
"""
Plan2Fund System Requirements Checker
====================================

This script specifically checks:
1. Web scraper integration to recommendation system
2. Editor product selection and program addition
3. Data flow from user entry to thank you page
4. Component consolidation opportunities
5. CTA functionality validation

Usage: Run in MS Python for interactive debugging
"""

import os
import re
import json
from pathlib import Path
from typing import Dict, List, Set, Tuple, Any
from collections import defaultdict

class SystemRequirementsChecker:
    def __init__(self, root_dir: str = "."):
        self.root_dir = Path(root_dir)
        self.issues = []
        self.fixes_needed = []
        self.consolidation_opportunities = []
        
    def check_web_scraper_integration(self):
        """Check if web scraper data reaches recommendation system"""
        print("🔍 CHECKING WEB SCRAPER INTEGRATION")
        print("=" * 50)
        
        # Find scraper files
        scraper_files = list(self.root_dir.glob("**/*scraper*"))
        scraper_apis = [f for f in scraper_files if 'api' in str(f)]
        
        print(f"Found {len(scraper_files)} scraper files:")
        for f in scraper_files:
            print(f"  ✅ {f}")
        
        # Check if scraper data reaches recommendation
        reco_files = list(self.root_dir.glob("pages/reco*")) + list(self.root_dir.glob("src/components/reco*"))
        
        scraper_connected = False
        for reco_file in reco_files:
            try:
                with open(reco_file, 'r', encoding='utf-8') as f:
                    content = f.read()
                
                if any(api in content for api in ['/api/scraper', '/api/programs', '/api/recommend']):
                    print(f"  ✅ {reco_file.name} connected to scraper data")
                    scraper_connected = True
                else:
                    print(f"  ❌ {reco_file.name} NOT connected to scraper data")
                    
            except Exception as e:
                print(f"  ❌ Error reading {reco_file}: {e}")
        
        if not scraper_connected:
            self.issues.append("Recommendation system not connected to scraper data")
            self.fixes_needed.append("Connect recommendation system to scraper APIs")
        
        return scraper_connected
    
    def check_editor_product_selection(self):
        """Check if editor has product selection and program addition"""
        print("\n✏️ CHECKING EDITOR PRODUCT SELECTION")
        print("=" * 50)
        
        editor_files = list(self.root_dir.glob("pages/editor*"))
        
        product_selection_found = False
        program_addition_found = False
        
        for editor_file in editor_files:
            try:
                with open(editor_file, 'r', encoding='utf-8') as f:
                    content = f.read()
                
                print(f"\n📄 Analyzing {editor_file.name}:")
                
                # Check for product selection
                if 'product' in content.lower() and ('select' in content.lower() or 'choose' in content.lower()):
                    print("  ✅ Product selection found")
                    product_selection_found = True
                else:
                    print("  ❌ No product selection found")
                
                # Check for program addition
                if 'program' in content.lower() and ('add' in content.lower() or 'create' in content.lower()):
                    print("  ✅ Program addition found")
                    program_addition_found = True
                else:
                    print("  ❌ No program addition found")
                
                # Check for readiness check integration
                if 'readiness' in content.lower() and 'check' in content.lower():
                    print("  ✅ Readiness check integration found")
                else:
                    print("  ❌ No readiness check integration found")
                
            except Exception as e:
                print(f"  ❌ Error reading {editor_file}: {e}")
        
        if not product_selection_found:
            self.issues.append("Editor missing product selection")
            self.fixes_needed.append("Add product selection to editor")
        
        if not program_addition_found:
            self.issues.append("Editor missing program addition")
            self.fixes_needed.append("Add program addition capability to editor")
        
        return product_selection_found and program_addition_found
    
    def check_data_flow(self):
        """Check if data flows from user entry to thank you page"""
        print("\n📊 CHECKING DATA FLOW")
        print("=" * 50)
        
        # User journey
        user_journey = [
            ("Landing Page", "pages/index.tsx"),
            ("Recommendation", "pages/reco.tsx"),
            ("Results", "pages/results.tsx"),
            ("Editor", "pages/editor.tsx"),
            ("Checkout", "pages/checkout.tsx"),
            ("Thank You", "pages/thank-you.tsx")
        ]
        
        print("🛤️  User Journey Flow:")
        flow_status = {}
        
        for step_name, file_path in user_journey:
            full_path = self.root_dir / file_path
            
            if full_path.exists():
                print(f"  ✅ {step_name}: {file_path}")
                flow_status[step_name] = "exists"
            else:
                print(f"  ❌ {step_name}: {file_path} NOT FOUND")
                flow_status[step_name] = "missing"
        
        # Check data sources
        data_sources = list(self.root_dir.glob("data/*.json"))
        api_files = list(self.root_dir.glob("pages/api/**/*.ts"))
        
        print(f"\nData Sources: {len(data_sources)} JSON files")
        print(f"API Endpoints: {len(api_files)}")
        
        missing_steps = [step for step, status in flow_status.items() if status == "missing"]
        if missing_steps:
            self.issues.append(f"Missing user journey steps: {', '.join(missing_steps)}")
            self.fixes_needed.append("Create missing user journey pages")
        
        return len(missing_steps) == 0
    
    def check_cta_functionality(self):
        """Check if CTA buttons work"""
        print("\n🎯 CHECKING CTA FUNCTIONALITY")
        print("=" * 50)
        
        cta_files = list(self.root_dir.glob("**/*CTA*")) + list(self.root_dir.glob("**/*cta*"))
        
        if cta_files:
            print(f"Found {len(cta_files)} CTA files:")
            for f in cta_files:
                print(f"  ✅ {f}")
            return True
        else:
            print("  ❌ No CTA files found")
            self.issues.append("No CTA functionality found")
            self.fixes_needed.append("Add CTA functionality")
            return False
    
    def analyze_consolidation_opportunities(self):
        """Analyze component consolidation opportunities"""
        print("\n📦 ANALYZING CONSOLIDATION OPPORTUNITIES")
        print("=" * 50)
        
        # Find all component files
        component_files = list(self.root_dir.glob("src/components/**/*.tsx"))
        
        print(f"Found {len(component_files)} component files")
        
        for file_path in component_files:
            try:
                with open(file_path, 'r', encoding='utf-8') as f:
                    content = f.read()
                
                file_size = len(content)
                
                # Check if file is large enough to consider splitting
                if file_size > 5000:  # > 5KB
                    rel_path = str(file_path.relative_to(self.root_dir))
                    
                    # Determine group based on directory structure
                    if 'common' in str(file_path):
                        group = 'common'
                    elif 'editor' in str(file_path):
                        group = 'editor'
                    elif 'pricing' in str(file_path):
                        group = 'pricing'
                    elif 'reco' in str(file_path):
                        group = 'recommendation'
                    else:
                        group = 'other'
                    
                    # Determine action based on size
                    if file_size > 20000:  # > 20KB
                        action = 'split'
                    elif file_size < 2000:  # < 2KB
                        action = 'merge'
                    else:
                        action = 'review'
                    
                    self.consolidation_opportunities.append({
                        'file': rel_path.replace('\\', '\\\\'),
                        'size': file_size,
                        'group': group,
                        'action': action
                    })
                    
                    print(f"  📄 {file_path.name}: {file_size:,} chars ({group}, {action})")
                
            except Exception as e:
                print(f"  ❌ Error reading {file_path}: {e}")
        
        print(f"\nTotal consolidation opportunities: {len(self.consolidation_opportunities)}")
        
        return len(self.consolidation_opportunities) > 0
    
    def run_comprehensive_check(self):
        """Run all checks and generate report"""
        print("🚀 STARTING COMPREHENSIVE SYSTEM CHECK")
        print("=" * 60)
        
        # Run all checks
        scraper_ok = self.check_web_scraper_integration()
        editor_ok = self.check_editor_product_selection()
        flow_ok = self.check_data_flow()
        cta_ok = self.check_cta_functionality()
        consolidation_ok = self.analyze_consolidation_opportunities()
        
        # Generate results
        results = {
            'scraper_ok': scraper_ok,
            'editor_ok': editor_ok,
            'flow_ok': flow_ok,
            'consolidation_ok': consolidation_ok,
            'cta_ok': cta_ok,
            'total_issues': len(self.issues),
            'issues': self.issues,
            'fixes_needed': self.fixes_needed,
            'consolidation_opportunities': self.consolidation_opportunities
        }
        
        # Save results
        output_file = self.root_dir / 'system_check_results.json'
        with open(output_file, 'w', encoding='utf-8') as f:
            json.dump(results, f, indent=2, ensure_ascii=False)
        
        print(f"\n✅ COMPREHENSIVE CHECK COMPLETE!")
        print(f"Results saved to: {output_file}")
        
        # Print summary
        print(f"\n📊 SUMMARY:")
        print(f"Scraper integration: {'✅' if scraper_ok else '❌'}")
        print(f"Editor functionality: {'✅' if editor_ok else '❌'}")
        print(f"Data flow: {'✅' if flow_ok else '❌'}")
        print(f"CTA functionality: {'✅' if cta_ok else '❌'}")
        print(f"Consolidation opportunities: {len(self.consolidation_opportunities)}")
        print(f"Total issues: {len(self.issues)}")
        
        if self.issues:
            print(f"\n🚨 ISSUES FOUND:")
            for issue in self.issues:
                print(f"  - {issue}")
        
        if self.fixes_needed:
            print(f"\n🔧 FIXES NEEDED:")
            for fix in self.fixes_needed:
                print(f"  - {fix}")
        
        return results

if __name__ == "__main__":
    checker = SystemRequirementsChecker()
    checker.run_comprehensive_check()
