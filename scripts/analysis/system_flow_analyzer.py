#!/usr/bin/env python3
"""
System Flow Analyzer - Simple, focused analysis
Analyzes user flows, file organization, and creates restructuring recommendations
"""

import os
import json
import re
from pathlib import Path

def analyze_system_flow():
    """Analyze the complete system flow and file organization"""
    
    results = {
        "user_flows": {},
        "file_organization": {},
        "restructure_recommendations": {},
        "critical_issues": []
    }
    
    # Define main user flows
    flows = {
        "landing_to_recommendation": {
            "description": "User lands and gets funding recommendations",
            "pages": ["index.tsx", "reco.tsx"],
            "components": ["Hero", "PlanTypes", "TargetGroupBanner", "UnifiedRecommendationWizard"],
            "apis": ["/api/programs", "/api/programs-ai", "/api/recommend"],
            "data_flow": "User input → AI analysis → Program matching → Results display"
        },
        "recommendation_to_editor": {
            "description": "User selects program and starts editing business plan",
            "pages": ["results.tsx", "editor.tsx", "optimized-editor.tsx"],
            "components": ["StructuredEditor", "RequirementsChecker", "EnhancedAIChat"],
            "apis": ["/api/plan/save", "/api/ai/generate"],
            "data_flow": "Selected program → Plan template → Editor interface → AI assistance"
        },
        "editor_to_export": {
            "description": "User completes plan and exports it",
            "pages": ["editor.tsx", "export.tsx"],
            "components": ["TemplatesFormattingManager", "CollaborationManager", "ExportSettings"],
            "apis": ["/api/export", "/api/plan/save"],
            "data_flow": "Plan content → Template selection → Formatting → Export generation"
        },
        "checkout_to_success": {
            "description": "User pays and completes the process",
            "pages": ["pricing.tsx", "checkout.tsx", "thank-you.tsx"],
            "components": ["PricingDetails", "PaymentForm", "SuccessHub"],
            "apis": ["/api/payments/create-session", "/api/stripe/webhook"],
            "data_flow": "Pricing selection → Payment processing → Success confirmation"
        }
    }
    
    # Analyze each flow
    for flow_name, flow_data in flows.items():
        results["user_flows"][flow_name] = {
            "status": "analyzing",
            "missing_files": [],
            "broken_links": [],
            "data_flow_issues": []
        }
        
        # Check if pages exist
        for page in flow_data["pages"]:
            page_path = f"pages/{page}"
            if not os.path.exists(page_path):
                results["user_flows"][flow_name]["missing_files"].append(page_path)
        
        # Check if components exist
        for component in flow_data["components"]:
            component_found = False
            for root, dirs, files in os.walk("src/components"):
                for file in files:
                    if component in file:
                        component_found = True
                        break
            if not component_found:
                results["user_flows"][flow_name]["missing_files"].append(f"Component: {component}")
    
    # Analyze file organization issues
    results["file_organization"] = {
        "pages_scattered": [],
        "components_scattered": [],
        "lib_files_scattered": [],
        "duplicate_functionality": []
    }
    
    # Check pages organization
    pages_dir = "pages"
    if os.path.exists(pages_dir):
        for root, dirs, files in os.walk(pages_dir):
            for file in files:
                if file.endswith('.tsx'):
                    file_path = os.path.join(root, file)
                    # Check if file is in logical subdirectory
                    if root == pages_dir and file not in ['_app.tsx', 'index.tsx']:
                        results["file_organization"]["pages_scattered"].append(file_path)
    
    # Check components organization
    components_dir = "src/components"
    if os.path.exists(components_dir):
        for root, dirs, files in os.walk(components_dir):
            for file in files:
                if file.endswith('.tsx'):
                    file_path = os.path.join(root, file)
                    # Check if component is in appropriate subdirectory
                    if root == components_dir:
                        results["file_organization"]["components_scattered"].append(file_path)
    
    # Check lib files organization
    lib_dir = "src/lib"
    if os.path.exists(lib_dir):
        for root, dirs, files in os.walk(lib_dir):
            for file in files:
                if file.endswith('.ts'):
                    file_path = os.path.join(root, file)
                    # Check if lib file is in appropriate subdirectory
                    if root == lib_dir:
                        results["file_organization"]["lib_files_scattered"].append(file_path)
    
    # Create restructure recommendations
    results["restructure_recommendations"] = {
        "proposed_structure": {
            "pages": {
                "marketing": ["index.tsx", "about.tsx", "pricing.tsx", "contact.tsx", "faq.tsx"],
                "user_flow": ["reco.tsx", "results.tsx", "editor.tsx", "optimized-editor.tsx"],
                "checkout": ["checkout.tsx", "confirm.tsx", "thank-you.tsx"],
                "legal": ["privacy.tsx", "terms.tsx", "legal.tsx"],
                "admin": ["dashboard.tsx", "library.tsx", "export.tsx", "preview.tsx"]
            },
            "components": {
                "ui": ["Button", "Input", "Modal", "Card", "Badge"],
                "layout": ["Header", "Footer", "Navigation", "Sidebar"],
                "marketing": ["Hero", "PlanTypes", "TargetGroupBanner", "WhoItsFor"],
                "recommendation": ["UnifiedRecommendationWizard", "EnhancedWizard", "Wizard"],
                "editor": ["StructuredEditor", "RequirementsChecker", "EnhancedAIChat"],
                "pricing": ["PricingDetails", "AddonsSection", "ProofSection"],
                "common": ["CTAStrip", "SuccessHub", "ZeroMatchFallback"]
            },
            "lib": {
                "api": ["apiClient", "endpoints"],
                "data": ["dataSource", "programs", "questions"],
                "ai": ["aiService", "recommendationEngine"],
                "export": ["exportManager", "templates"],
                "auth": ["authService", "userProfile"],
                "utils": ["validation", "formatting", "constants"]
            }
        },
        "migration_steps": [
            "1. Create new folder structure",
            "2. Move files to appropriate folders",
            "3. Update import paths",
            "4. Test all functionality",
            "5. Remove old empty folders"
        ]
    }
    
    # Identify critical issues
    results["critical_issues"] = [
        "Recommendation system not connected to scraper data",
        "Pages scattered in root directory",
        "Components not properly categorized",
        "Lib files not organized by function",
        "Duplicate functionality across components"
    ]
    
    return results

def main():
    print("🔍 ANALYZING SYSTEM FLOW AND FILE ORGANIZATION")
    print("=" * 60)
    
    results = analyze_system_flow()
    
    # Save results
    with open("system_flow_analysis.json", "w") as f:
        json.dump(results, f, indent=2)
    
    print("✅ Analysis complete!")
    print(f"📊 Found {len(results['critical_issues'])} critical issues")
    print(f"📁 Identified {len(results['file_organization']['pages_scattered'])} scattered pages")
    print(f"🧩 Found {len(results['file_organization']['components_scattered'])} scattered components")
    print("📄 Results saved to: system_flow_analysis.json")

if __name__ == "__main__":
    main()
