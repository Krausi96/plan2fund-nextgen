---
id: aws_erp_kredit
name: aws ERP Kredit
country: AT
type: loan
stages: [mvp, pilot, revenue, scaling]
sectors: [tech, manufacturing, services]
amount_min: 25000
amount_max: 500000
trl_range: [6, 9]
application_complexity: 3
timeline_speed: 2
success_rate: 0.65
jurisdiction: AT
tags: [loan, sme, working_capital]
source_url: https://www.aws.at/aws-erp-kredit/
last_updated: 2025-09-16
# Extended schema fields
sme_size_class: small
company_age_years_min: 1
company_age_years_max: 10
region_nuts: ["AT1", "AT2", "AT3"]
call_deadline: rolling
project_duration_months_min: 12
project_duration_months_max: 60
eligible_cost_categories: ["working_capital", "equipment", "personnel"]
de_minimis_applicable: false
evaluation_weights: { financial_strength: 0.4, business_plan: 0.3, collateral: 0.2, experience: 0.1 }
success_rate_note: "65% approval rate for qualified applicants"
docs_required: ["business_plan", "financial_statements", "collateral_documents", "bank_statements"]
# Loan specific fields
loan_term_years_min: 1
loan_term_years_max: 5
interest_subsidy: false
guarantee_coverage_pct: 80
collateral_types_accepted: ["real_estate", "equipment", "personal_guarantee"]
ltv_max_pct: 80
min_credit_signal: "No negative KSV entries"
financial_covenants: ["debt_service_ratio", "current_ratio"]
---

# aws ERP Kredit

## Overview
Austrian working capital loan program for SMEs with flexible terms and government guarantee.

## Key Requirements
- SMEs in Austria with established business operations
- Minimum 1 year of business activity
- Positive credit history (no negative KSV entries)
- Collateral or personal guarantee required

## Key Exclusions
- Startups without established revenue
- Companies with negative credit history
- Projects outside Austria

## Funding Details
- **Amount**: €25,000 - €500,000
- **Interest Rate**: Market rate with 80% guarantee
- **Term**: 1-5 years
- **Guarantee**: 80% government guarantee
- **Submission**: Rolling application

## Documents Required
- Business plan and financial projections
- 3 years of financial statements
- Collateral documentation
- Bank statements (6 months)
- Credit report (KSV)

## Eligibility Criteria
- **Country**: Austria only
- **Entity Stage**: Incorporated companies (1+ years)
- **Company Size**: Small to medium enterprises
- **Collateral**: Real estate, equipment, or personal guarantee
- **Credit**: No negative KSV entries
