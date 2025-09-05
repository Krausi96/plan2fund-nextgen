# QUESTION_MAPPING

Version: 2025-09-05

This mapping shows how each universal question (q1–q10) influences routing and overlays. Keep sentences short in the table.

| QID | Field | Examples / Values | Used for |
|---|---|---|---|
| q1_country | country | AT / EU / NON_EU | Show national AT; EU calls |
| q2_entity_stage | incorporation age | PRE_COMPANY / INC_LT_6M / ... | aws Preseed filters; SME checks |
| q3_company_size | SME size | micro / small / medium / large | SME/large rules; bonuses |
| q4_theme | tags | innovation / sustainability / health / space | Topic routing & boosts |
| q5_maturity_trl | TRL band | 1–2 / 3–4 / 5–6 / 7–8 / 9+ | EIC Accelerator ≥5; demo vs RIA |
| q6_rnd_in_at | R&D in AT | yes / no / unsure | Basisprogramm; national R&D |
| q7_collaboration | coop type | none / research / company / both | Coop bonuses; consortium |
| q8_funding_types | preference | grant / loan / guarantee / equity | Skip loans/guarantees |
| q9_team_diversity | women >25% | yes / no / unknown | aws gender bonus |
| q10_env_benefit | env impact | strong / some / none | Umweltförderung; LIFE |