// Simple Dynamic Wizard - Minimal replacement for quarantined files

export interface Question {
  id: string;
  label: string;
  type: 'single-select' | 'multi-select';
  options: Array<{ value: string; label: string }>;
  required: boolean;
  informationValue: number;
  programsAffected: number;
}

export class DynamicWizardEngine {
  getQuestionOrder(): Question[] {
    // Return the universal questions from the questions data
    // This is a simplified version that just returns the basic questions
    return [
      {
        id: "q1_country",
        label: "Where will the project be carried out?",
        type: "single-select",
        options: [
          { value: "AT", label: "Austria only" },
          { value: "EU", label: "EU (incl. Austria)" },
          { value: "NON_EU", label: "Outside EU" }
        ],
        required: true,
        informationValue: 1,
        programsAffected: 1
      },
      {
        id: "q2_entity_stage",
        label: "What is your legal setup & company age?",
        type: "single-select",
        options: [
          { value: "PRE_COMPANY", label: "Not yet incorporated (team / natural persons)" },
          { value: "INC_LT_6M", label: "Incorporated < 6 months" },
          { value: "INC_6_36M", label: "Incorporated 6–36 months" },
          { value: "INC_GT_36M", label: "Incorporated > 36 months" },
          { value: "RESEARCH_ORG", label: "Research organisation / university" },
          { value: "NONPROFIT", label: "Non-profit / association" }
        ],
        required: true,
        informationValue: 1,
        programsAffected: 1
      },
      {
        id: "q3_company_size",
        label: "How many employees (FTE) does your organisation have?",
        type: "single-select",
        options: [
          { value: "MICRO_0_9", label: "0–9 (micro)" },
          { value: "SMALL_10_49", label: "10–49 (small)" },
          { value: "MEDIUM_50_249", label: "50–249 (medium)" },
          { value: "LARGE_250_PLUS", label: "250+ (large)" }
        ],
        required: true,
        informationValue: 1,
        programsAffected: 1
      },
      {
        id: "q4_theme",
        label: "Which area(s) best fit your project?",
        type: "multi-select",
        options: [
          { value: "INNOVATION_DIGITAL", label: "Innovation / Digital / Deep Tech" },
          { value: "SUSTAINABILITY", label: "Sustainability / Climate / Energy / Environment" },
          { value: "HEALTH_LIFE_SCIENCE", label: "Health / Life Sciences / MedTech / Biotech" },
          { value: "SPACE_DOWNSTREAM", label: "Space / GNSS / Earth Observation (downstream)" },
          { value: "INDUSTRY_MANUFACTURING", label: "Industry / Manufacturing" },
          { value: "OTHER", label: "Other" }
        ],
        required: true,
        informationValue: 1,
        programsAffected: 1
      },
      {
        id: "q5_maturity_trl",
        label: "What is your current maturity (approx. TRL)?",
        type: "single-select",
        options: [
          { value: "TRL_1_2", label: "Idea / Research (TRL 1–2)" },
          { value: "TRL_3_4", label: "Proof of concept (TRL 3–4)" },
          { value: "TRL_5_6", label: "Prototype / demonstrator (TRL 5–6)" },
          { value: "TRL_7_8", label: "Pilot / market launch (TRL 7–8)" },
          { value: "TRL_9", label: "Scaling (TRL 9+)" }
        ],
        required: true,
        informationValue: 1,
        programsAffected: 1
      },
      {
        id: "q6_rnd_in_at",
        label: "Will you conduct R&D or experimental development in Austria?",
        type: "single-select",
        options: [
          { value: "YES", label: "Yes" },
          { value: "NO", label: "No" },
          { value: "UNSURE", label: "Unsure" }
        ],
        required: true,
        informationValue: 1,
        programsAffected: 1
      },
      {
        id: "q7_collaboration",
        label: "Do you plan to collaborate with research institutions or companies?",
        type: "single-select",
        options: [
          { value: "NONE", label: "No collaboration planned" },
          { value: "WITH_RESEARCH", label: "With research institution(s)" },
          { value: "WITH_COMPANY", label: "With company(ies)" },
          { value: "WITH_BOTH", label: "With both research & companies" }
        ],
        required: true,
        informationValue: 1,
        programsAffected: 1
      },
      {
        id: "q8_funding_types",
        label: "Which funding types are acceptable? (affects skip logic)",
        type: "multi-select",
        options: [
          { value: "GRANT", label: "Grants" },
          { value: "LOAN", label: "Loans" },
          { value: "GUARANTEE", label: "Guarantees" },
          { value: "EQUITY", label: "Equity / blended finance" }
        ],
        required: true,
        informationValue: 1,
        programsAffected: 1
      },
      {
        id: "q9_team_diversity",
        label: "At grant award, will women own >25% of shares (or will they)?",
        type: "single-select",
        options: [
          { value: "YES", label: "Yes" },
          { value: "NO", label: "No" },
          { value: "UNKNOWN", label: "Not sure / TBD" }
        ],
        required: true,
        informationValue: 1,
        programsAffected: 1
      },
      {
        id: "q10_env_benefit",
        label: "Will the project measurably reduce emissions/energy/waste in the EU?",
        type: "single-select",
        options: [
          { value: "STRONG", label: "Yes, central to the project" },
          { value: "SOME", label: "Partly / co-benefit" },
          { value: "NONE", label: "No / not applicable" }
        ],
        required: true,
        informationValue: 1,
        programsAffected: 1
      }
    ];
  }
}

export const dynamicWizard = new DynamicWizardEngine();
