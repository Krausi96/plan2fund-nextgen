#!/bin/bash
# Editor Cleanup Script
# Removes unused files from features/editor

set -e

echo "🧹 Cleaning up unused editor files..."

# Delete unused components
echo "Deleting unused components..."
rm -f features/editor/components/ProductSelectionModal.tsx
rm -f features/editor/components/ProgramSelector.tsx

# Delete unused prompts
echo "Deleting unused prompts..."
rm -f features/editor/prompts/sectionPrompts.ts

# Delete unused types
echo "Deleting unused types..."
rm -f features/editor/types/editor.ts

# Remove empty prompts folder if it exists
if [ -d "features/editor/prompts" ] && [ -z "$(ls -A features/editor/prompts 2>/dev/null)" ]; then
  echo "Removing empty prompts folder..."
  rmdir features/editor/prompts
fi

echo ""
echo "✅ Cleanup complete!"
echo ""
echo "📋 Files deleted:"
echo "  - ProductSelectionModal.tsx"
echo "  - ProgramSelector.tsx"
echo "  - sectionPrompts.ts"
echo "  - editor.ts"
echo ""
echo "⚠️  Please verify no broken imports with:"
echo "  grep -r 'ProductSelectionModal\\|ProgramSelector\\|sectionPrompts\\|from.*editor\\.ts' features/ pages/"

