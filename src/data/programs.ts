// Programs data embedded directly to avoid import issues
const programsData = {
  "version": "2025-09-05",
  "programs": [
    {
      "id": "aws_preseed_innovative_solutions",
      "name": "AWS PreSeed Innovative Solutions",
      "title": "AWS PreSeed Innovative Solutions",
      "type": "grant",
      "maxAmount": 50000,
      "eligibility": [
        "q1_country:AT",
        "q2_entity_stage:PRE_COMPANY,INC_LT_6M",
        "q3_company_size:MICRO_0_9",
        "q4_theme:INNOVATION_DIGITAL,SUSTAINABILITY,HEALTH_LIFE_SCIENCE"
      ],
      "overlays": {
        "q5_maturity_trl": "TRL_1_2,TRL_3_4",
        "q6_rnd_in_at": "YES"
      },
      "link": "https://aws.at/preseed",
      "notes": "Early-stage innovation support"
    },
    {
      "id": "ffg_basisprogramm_2025",
      "name": "FFG Basisprogramm 2025",
      "title": "FFG Basisprogramm 2025",
      "type": "grant",
      "maxAmount": 200000,
      "eligibility": [
        "q1_country:AT",
        "q2_entity_stage:INC_LT_6M,INC_6_36M,INC_GT_36M",
        "q3_company_size:MICRO_0_9,SMALL_10_49,MEDIUM_50_249"
      ],
      "overlays": {
        "q5_maturity_trl": "TRL_3_4,TRL_5_6,TRL_7_8",
        "q6_rnd_in_at": "YES"
      },
      "link": "https://ffg.at/basisprogramm",
      "notes": "General R&D funding program"
    },
    {
      "id": "eic_accelerator_2025",
      "name": "EIC Accelerator 2025",
      "title": "EIC Accelerator 2025",
      "type": "grant",
      "maxAmount": 2500000,
      "eligibility": [
        "q1_country:EU",
        "q2_entity_stage:INC_LT_6M,INC_6_36M,INC_GT_36M",
        "q3_company_size:MICRO_0_9,SMALL_10_49,MEDIUM_50_249"
      ],
      "overlays": {
        "q4_theme": "INNOVATION_DIGITAL,SUSTAINABILITY,HEALTH_LIFE_SCIENCE,SPACE_DOWNSTREAM",
        "q5_maturity_trl": "TRL_5_6,TRL_7_8,TRL_9"
      },
      "link": "https://eic.ec.europa.eu/accelerator",
      "notes": "EU innovation accelerator program"
    }
  ]
};

export default programsData;
