// Questions data with translation support
export const getQuestionsData = (t: (key: any) => string) => ({
  "version": "2025-09-05",
  "universal": [
    {
      "id": "q1_country",
      "label": t("questions.q1_country"),
      "type": "single-select",
      "options": [
        {
          "value": "AT",
          "label": t("questions.q1_country.AT")
        },
        {
          "value": "EU",
          "label": t("questions.q1_country.EU")
        },
        {
          "value": "NON_EU",
          "label": t("questions.q1_country.NON_EU")
        }
      ],
      "required": true
    },
    {
      "id": "q2_entity_stage",
      "label": t("questions.q2_entity_stage"),
      "type": "single-select",
      "options": [
        {
          "value": "PRE_COMPANY",
          "label": t("questions.q2_entity_stage.PRE_COMPANY")
        },
        {
          "value": "INC_LT_6M",
          "label": t("questions.q2_entity_stage.INC_LT_6M")
        },
        {
          "value": "INC_6_36M",
          "label": t("questions.q2_entity_stage.INC_6_36M")
        },
        {
          "value": "INC_GT_36M",
          "label": t("questions.q2_entity_stage.INC_GT_36M")
        },
        {
          "value": "RESEARCH_ORG",
          "label": t("questions.q2_entity_stage.RESEARCH_ORG")
        },
        {
          "value": "NONPROFIT",
          "label": t("questions.q2_entity_stage.NONPROFIT")
        }
      ],
      "required": true
    },
    {
      "id": "q3_company_size",
      "label": t("questions.q3_company_size"),
      "type": "single-select",
      "options": [
        {
          "value": "MICRO_0_9",
          "label": t("questions.q3_company_size.MICRO_0_9")
        },
        {
          "value": "SMALL_10_49",
          "label": t("questions.q3_company_size.SMALL_10_49")
        },
        {
          "value": "MEDIUM_50_249",
          "label": t("questions.q3_company_size.MEDIUM_50_249")
        },
        {
          "value": "LARGE_250_PLUS",
          "label": t("questions.q3_company_size.LARGE_250_PLUS")
        }
      ],
      "required": true
    },
    {
      "id": "q4_theme",
      "label": t("questions.q4_theme"),
      "type": "multi-select",
      "options": [
        {
          "value": "INNOVATION_DIGITAL",
          "label": t("questions.q4_theme.INNOVATION_DIGITAL")
        },
        {
          "value": "SUSTAINABILITY",
          "label": t("questions.q4_theme.SUSTAINABILITY")
        },
        {
          "value": "HEALTH_LIFE_SCIENCE",
          "label": t("questions.q4_theme.HEALTH_LIFE_SCIENCE")
        },
        {
          "value": "SPACE_DOWNSTREAM",
          "label": t("questions.q4_theme.SPACE_DOWNSTREAM")
        },
        {
          "value": "INDUSTRY_MANUFACTURING",
          "label": t("questions.q4_theme.MANUFACTURING")
        },
        {
          "value": "OTHER",
          "label": t("questions.q4_theme.OTHER")
        }
      ],
      "required": true
    },
    {
      "id": "q5_maturity_trl",
      "label": "How developed is your project?",
      "type": "single-select",
      "options": [
        {
          "value": "TRL_1_2",
          "label": "Just an idea or early research"
        },
        {
          "value": "TRL_3_4",
          "label": "Proof of concept - basic testing done"
        },
        {
          "value": "TRL_5_6",
          "label": "Working prototype or demonstrator"
        },
        {
          "value": "TRL_7_8",
          "label": "Pilot testing or market launch"
        },
        {
          "value": "TRL_9",
          "label": "Ready for scaling and growth"
        }
      ],
      "required": true
    },
    {
      "id": "q6_rnd_in_at",
      "label": "Will you conduct R&D or experimental development in Austria?",
      "type": "single-select",
      "options": [
        {
          "value": "YES",
          "label": "Yes"
        },
        {
          "value": "NO",
          "label": "No"
        },
        {
          "value": "UNSURE",
          "label": "Unsure"
        }
      ],
      "required": true
    },
    {
      "id": "q7_collaboration",
      "label": "Do you plan to collaborate with research institutions or companies?",
      "type": "single-select",
      "options": [
        {
          "value": "NONE",
          "label": "No collaboration planned"
        },
        {
          "value": "WITH_RESEARCH",
          "label": "With research institution(s)"
        },
        {
          "value": "WITH_COMPANY",
          "label": "With company(ies)"
        },
        {
          "value": "WITH_BOTH",
          "label": "With both research & companies"
        }
      ],
      "required": true
    },
    {
      "id": "q8_funding_types",
      "label": "Which funding types are you interested in?",
      "type": "multi-select",
      "options": [
        {
          "value": "GRANT",
          "label": "Grants"
        },
        {
          "value": "LOAN",
          "label": "Loans"
        },
        {
          "value": "GUARANTEE",
          "label": "Guarantees"
        },
        {
          "value": "EQUITY",
          "label": "Equity / blended finance"
        }
      ],
      "required": true
    },
    {
      "id": "q9_team_diversity",
      "label": "At grant award, will women own >25% of shares (or will they)?",
      "type": "single-select",
      "options": [
        {
          "value": "YES",
          "label": "Yes"
        },
        {
          "value": "NO",
          "label": "No"
        },
        {
          "value": "UNKNOWN",
          "label": "Not sure / TBD"
        }
      ],
      "required": true
    },
    {
      "id": "q10_env_benefit",
      "label": "Will the project measurably reduce emissions/energy/waste in the EU?",
      "type": "single-select",
      "options": [
        {
          "value": "STRONG",
          "label": "Yes, central to the project"
        },
        {
          "value": "SOME",
          "label": "Partly / co-benefit"
        },
        {
          "value": "NONE",
          "label": "No / not applicable"
        }
      ],
      "required": true
    }
  ],
  "branching_rules": [
    {
      "description": "Skip loans/guarantees if user only wants grants",
      "ask_if": "not ('LOAN' in answers.q8_funding_types or 'GUARANTEE' in answers.q8_funding_types)",
      "effect": "hide_products_with_types=['loan','guarantee']"
    },
    {
      "description": "Show Austrian national programmes only if project is in Austria",
      "ask_if": "answers.q1_country == 'AT' or (answers.q1_country == 'EU')",
      "effect": "show_at_national=true"
    },
    {
      "description": "Health & Life Science specialised programmes",
      "ask_if": "'HEALTH_LIFE_SCIENCE' in answers.q4_theme",
      "effect": "boost_tags=['health','life_science']"
    },
    {
      "description": "Sustainability/Climate specialised programmes",
      "ask_if": "'SUSTAINABILITY' in answers.q4_theme or answers.q10_env_benefit in ['STRONG','SOME']",
      "effect": "boost_tags=['sustainability','climate','energy','environment']"
    },
    {
      "description": "Space downstream specialised programmes",
      "ask_if": "'SPACE_DOWNSTREAM' in answers.q4_theme",
      "effect": "boost_tags=['space','gnss','eo']"
    }
  ]
});

// Keep the old export for backward compatibility
const questionsData = getQuestionsData((key: string) => key);
export default questionsData;
