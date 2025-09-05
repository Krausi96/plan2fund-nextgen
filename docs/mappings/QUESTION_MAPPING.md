# QUESTION_MAPPING

| Question ID         | Maps To Fields                             | Type |
|---------------------|--------------------------------------------|------|
| q1_location         | jurisdiction.country                       | HARD |
| q2_state            | jurisdiction.state                         | HARD |
| q3_residency_status | founder.residency_status                   | HARD |
| q4_stage            | company.age_bracket, program.stage         | HARD |
| q5_team             | company.headcount_fte                      | HARD |
| q6_innovation       | project.innovation_novelty, project.is_RnD  | SOFT |
| q7_industry         | company.industry_tags                      | SOFT |
| q8_budget           | project.total_budget_eur                   | HARD |
| q9_own_contribution | finance.own_funds_ratio                    | HARD |
| q10_finance_type    | finance.accepted_instruments[]             | HARD |
