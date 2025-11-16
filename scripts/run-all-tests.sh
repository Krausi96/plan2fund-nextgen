#!/bin/bash
# Run All Editor Tests
# This script helps run all tests for the editor

echo "🧪 Running Editor Tests..."
echo ""

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: Must run from project root"
    exit 1
fi

echo "📋 Available Tests:"
echo ""
echo "1. Browser Console Test"
echo "   - Open /editor in browser"
echo "   - Open console (F12)"
echo "   - Run: testCompleteEditorFlow()"
echo ""
echo "2. TypeScript Test"
echo "   - Import: scripts/test-business-plan-creation.ts"
echo "   - Run: testBusinessPlanCreation()"
echo ""
echo "3. Manual Test Flow"
echo "   - See: docs/EDITOR_TESTING_INSTRUCTIONS.md"
echo ""
echo "✅ Test scripts ready!"
echo ""
echo "📖 Documentation:"
echo "   - docs/EDITOR_HANDOVER_FOR_COLLEAGUE.md"
echo "   - docs/EDITOR_TESTING_INSTRUCTIONS.md"
echo "   - docs/EDITOR_CRITICAL_FLAWS.md"
echo ""

