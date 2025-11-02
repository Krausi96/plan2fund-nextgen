# Proper File Mapping - Based on Actual Analysis

## Key Insights:

1. **CartSummary** uses `@/lib/pricing` → `features/export/components` (checkout flow)
2. **pricing/** components → `features/export/components/pricing/` 
3. **payments.ts** & **pricing.ts** → `features/export/engine/`
4. **SmartWizard** → `features/reco/components/wizard/`
5. **components/common/** → Need to check if truly shared or feature-specific

## Let me create a proper manual mapping first, then we'll automate the migration.

