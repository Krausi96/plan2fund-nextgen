// ========= PLAN2FUND — ADDITIONAL REQUIREMENTS =========
// User-provided requirements by target group and funding type

export type TargetGroup = 'startups' | 'sme' | 'advisors' | 'universities';
export type FundingType = 'grants' | 'bankLoans' | 'equity' | 'visa';

export interface AdditionalRequirement {
  id: string;
  title: string;
  description: string;
  category: 'legal' | 'financial' | 'personal' | 'business' | 'technical';
  isRequired: boolean;
  priority: 'critical' | 'high' | 'medium' | 'low';
  estimatedTime: string;
  cost?: number;
  i18nKey: string;
  sources: string[];
}

export interface RequirementsMatrix {
  targetGroup: TargetGroup;
  fundingType: FundingType;
  requirements: AdditionalRequirement[];
  description: string;
  i18nKey: string;
}

// Additional requirements by target group and funding type
export const additionalRequirements: Record<TargetGroup, Record<FundingType, RequirementsMatrix>> = {
  startups: {
    grants: {
      targetGroup: 'startups',
      fundingType: 'grants',
      description: 'Additional documents you must provide for grant applications',
      i18nKey: 'requirements.startups.grants',
      requirements: [
        {
          id: 'company_registration',
          title: 'Company Registration Documents',
          description: 'Firmenbuchauszug (company register extract) or Gewerbeanmeldung (business registration)',
          category: 'legal',
          isRequired: true,
          priority: 'critical',
          estimatedTime: '1-2 weeks',
          i18nKey: 'requirements.companyRegistration',
          sources: ['Austrian Commercial Register', 'WKO Guidelines']
        },
        {
          id: 'financial_health_form',
          title: 'Financial Health Form',
          description: 'Attested financial health form from tax consultant (Bilanzbuchhalter)',
          category: 'financial',
          isRequired: true,
          priority: 'critical',
          estimatedTime: '1 week',
          cost: 200,
          i18nKey: 'requirements.financialHealthForm',
          sources: ['FFG Guidelines', 'Austrian Tax Consultant Association']
        },
        {
          id: 'credit_rating',
          title: 'Credit Rating Report',
          description: 'Credit rating report from KSV1870 or similar credit agency',
          category: 'financial',
          isRequired: true,
          priority: 'high',
          estimatedTime: '3-5 days',
          cost: 50,
          i18nKey: 'requirements.creditRating',
          sources: ['KSV1870', 'FFG Requirements']
        },
        {
          id: 'project_concept',
          title: 'Project Concept/Idea',
          description: 'Short project description and innovation concept (1-2 pages)',
          category: 'business',
          isRequired: true,
          priority: 'high',
          estimatedTime: '1-2 days',
          i18nKey: 'requirements.projectConcept',
          sources: ['FFG Application Guidelines']
        },
        {
          id: 'team_cvs',
          title: 'Team CVs',
          description: 'Detailed CVs of all team members with relevant qualifications',
          category: 'personal',
          isRequired: true,
          priority: 'high',
          estimatedTime: '2-3 days',
          i18nKey: 'requirements.teamCVs',
          sources: ['FFG Guidelines', 'Horizon Europe Requirements']
        }
      ]
    },
    bankLoans: {
      targetGroup: 'startups',
      fundingType: 'bankLoans',
      description: 'Additional documents you must provide for bank loan applications',
      i18nKey: 'requirements.startups.bankLoans',
      requirements: [
        {
          id: 'personal_id',
          title: 'Personal Identification',
          description: 'Valid passport or Austrian ID card',
          category: 'personal',
          isRequired: true,
          priority: 'critical',
          estimatedTime: 'Immediate',
          i18nKey: 'requirements.personalId',
          sources: ['Austrian Banking Standards']
        },
        {
          id: 'meldezettel',
          title: 'Meldezettel',
          description: 'Proof of residence registration in Austria',
          category: 'personal',
          isRequired: true,
          priority: 'critical',
          estimatedTime: '1-2 days',
          i18nKey: 'requirements.meldezettel',
          sources: ['Austrian Residence Law']
        },
        {
          id: 'business_ownership',
          title: 'Business Ownership Proof',
          description: 'Proof of business ownership (sole proprietorship or company shares)',
          category: 'legal',
          isRequired: true,
          priority: 'critical',
          estimatedTime: '1 week',
          i18nKey: 'requirements.businessOwnership',
          sources: ['Austrian Commercial Law']
        },
        {
          id: 'notarized_act',
          title: 'Notarized Company Act',
          description: 'Notarized company formation act (for companies) or business registration (for sole proprietors)',
          category: 'legal',
          isRequired: true,
          priority: 'critical',
          estimatedTime: '1-2 weeks',
          cost: 500,
          i18nKey: 'requirements.notarizedAct',
          sources: ['Austrian Notary Law']
        },
        {
          id: 'forecast_1year',
          title: '1-Year Financial Forecast',
          description: 'Detailed 1-year financial forecast with monthly breakdown',
          category: 'financial',
          isRequired: true,
          priority: 'high',
          estimatedTime: '3-5 days',
          i18nKey: 'requirements.forecast1Year',
          sources: ['Austrian Banking Guidelines']
        }
      ]
    },
    equity: {
      targetGroup: 'startups',
      fundingType: 'equity',
      description: 'Additional documents you must provide for equity investment',
      i18nKey: 'requirements.startups.equity',
      requirements: [
        {
          id: 'corporate_docs',
          title: 'Corporate Documents',
          description: 'Company formation documents, shareholder agreements, and corporate governance documents',
          category: 'legal',
          isRequired: true,
          priority: 'critical',
          estimatedTime: '1-2 weeks',
          i18nKey: 'requirements.corporateDocs',
          sources: ['Austrian Corporate Law', 'VC Due Diligence Standards']
        },
        {
          id: 'ip_assignments',
          title: 'IP Assignments',
          description: 'Intellectual property assignments and protection documents',
          category: 'legal',
          isRequired: true,
          priority: 'high',
          estimatedTime: '2-4 weeks',
          cost: 1000,
          i18nKey: 'requirements.ipAssignments',
          sources: ['Austrian IP Law', 'VC Standards']
        },
        {
          id: 'key_contracts',
          title: 'Key Contracts',
          description: 'Customer contracts, supplier agreements, and key business partnerships',
          category: 'business',
          isRequired: true,
          priority: 'high',
          estimatedTime: '1-2 weeks',
          i18nKey: 'requirements.keyContracts',
          sources: ['VC Due Diligence Standards']
        },
        {
          id: 'market_research',
          title: 'Market Research',
          description: 'Independent market research and competitive analysis',
          category: 'business',
          isRequired: false,
          priority: 'medium',
          estimatedTime: '2-4 weeks',
          cost: 2000,
          i18nKey: 'requirements.marketResearch',
          sources: ['VC Due Diligence Standards']
        }
      ]
    },
    visa: {
      targetGroup: 'startups',
      fundingType: 'visa',
      description: 'Additional documents you must provide for RWR visa applications',
      i18nKey: 'requirements.startups.visa',
      requirements: [
        {
          id: 'passport',
          title: 'Valid Passport',
          description: 'Passport valid for at least 2 years with at least 2 blank pages',
          category: 'personal',
          isRequired: true,
          priority: 'critical',
          estimatedTime: '2-8 weeks',
          i18nKey: 'requirements.passport',
          sources: ['Austrian Immigration Law']
        },
        {
          id: 'birth_certificate',
          title: 'Birth Certificate',
          description: 'Official birth certificate with apostille or legalization',
          category: 'personal',
          isRequired: true,
          priority: 'critical',
          estimatedTime: '2-4 weeks',
          i18nKey: 'requirements.birthCertificate',
          sources: ['Austrian Immigration Law']
        },
        {
          id: 'accommodation_proof',
          title: 'Accommodation Proof',
          description: 'Proof of accommodation in Austria (rental agreement or property ownership)',
          category: 'personal',
          isRequired: true,
          priority: 'critical',
          estimatedTime: '1-2 weeks',
          i18nKey: 'requirements.accommodationProof',
          sources: ['Austrian Immigration Law']
        },
        {
          id: 'health_insurance',
          title: 'Health Insurance',
          description: 'Comprehensive health insurance coverage in Austria',
          category: 'personal',
          isRequired: true,
          priority: 'critical',
          estimatedTime: '1 week',
          cost: 200,
          i18nKey: 'requirements.healthInsurance',
          sources: ['Austrian Health Insurance Law']
        },
        {
          id: 'funds_proof',
          title: 'Proof of Funds',
          description: 'Bank statements proving €30,000+ available funds',
          category: 'financial',
          isRequired: true,
          priority: 'critical',
          estimatedTime: '1 week',
          i18nKey: 'requirements.fundsProof',
          sources: ['RWR Visa Requirements']
        }
      ]
    }
  },
  sme: {
    grants: {
      targetGroup: 'sme',
      fundingType: 'grants',
      description: 'Additional documents you must provide for grant applications',
      i18nKey: 'requirements.sme.grants',
      requirements: [
        {
          id: 'company_registration',
          title: 'Company Registration Documents',
          description: 'Firmenbuchauszug (company register extract) and business registration',
          category: 'legal',
          isRequired: true,
          priority: 'critical',
          estimatedTime: '1-2 weeks',
          i18nKey: 'requirements.companyRegistration',
          sources: ['Austrian Commercial Register', 'WKO Guidelines']
        },
        {
          id: 'financial_statements_3years',
          title: '3-Year Financial Statements',
          description: 'Audited financial statements for the last 3 years (Balance Sheet, P&L)',
          category: 'financial',
          isRequired: true,
          priority: 'critical',
          estimatedTime: '1-2 weeks',
          i18nKey: 'requirements.financialStatements3Years',
          sources: ['FFG Guidelines', 'Austrian Accounting Standards']
        },
        {
          id: 'tax_statements',
          title: 'Tax Office Statements',
          description: 'Current tax office statements and payment confirmations',
          category: 'financial',
          isRequired: true,
          priority: 'high',
          estimatedTime: '1 week',
          i18nKey: 'requirements.taxStatements',
          sources: ['Austrian Tax Office']
        },
        {
          id: 'health_insurance_statements',
          title: 'Health Insurance Statements',
          description: 'Current health insurance statements for all employees',
          category: 'financial',
          isRequired: true,
          priority: 'high',
          estimatedTime: '1 week',
          i18nKey: 'requirements.healthInsuranceStatements',
          sources: ['Austrian Health Insurance System']
        },
        {
          id: 'consortium_declaration',
          title: 'Consortium Declaration',
          description: 'Consortium declaration if applying as part of a multi-partner project',
          category: 'legal',
          isRequired: false,
          priority: 'medium',
          estimatedTime: '1-2 weeks',
          i18nKey: 'requirements.consortiumDeclaration',
          sources: ['Horizon Europe Guidelines']
        }
      ]
    },
    bankLoans: {
      targetGroup: 'sme',
      fundingType: 'bankLoans',
      description: 'Additional documents you must provide for bank loan applications',
      i18nKey: 'requirements.sme.bankLoans',
      requirements: [
        {
          id: 'financial_statements_3years',
          title: '3-Year Financial Statements',
          description: 'Audited financial statements for the last 3 years',
          category: 'financial',
          isRequired: true,
          priority: 'critical',
          estimatedTime: '1-2 weeks',
          i18nKey: 'requirements.financialStatements3Years',
          sources: ['Austrian Banking Standards']
        },
        {
          id: 'current_balance_sheet',
          title: 'Current Balance Sheet',
          description: 'Most recent balance sheet (not older than 3 months)',
          category: 'financial',
          isRequired: true,
          priority: 'critical',
          estimatedTime: '1 week',
          i18nKey: 'requirements.currentBalanceSheet',
          sources: ['Austrian Banking Guidelines']
        },
        {
          id: 'tax_statements',
          title: 'Tax Office Statements',
          description: 'Current tax office statements and payment confirmations',
          category: 'financial',
          isRequired: true,
          priority: 'high',
          estimatedTime: '1 week',
          i18nKey: 'requirements.taxStatements',
          sources: ['Austrian Tax Office']
        },
        {
          id: 'collateral_list',
          title: 'Collateral List',
          description: 'Detailed list of assets available as collateral with valuations',
          category: 'financial',
          isRequired: true,
          priority: 'high',
          estimatedTime: '1-2 weeks',
          i18nKey: 'requirements.collateralList',
          sources: ['Austrian Banking Standards']
        },
        {
          id: 'management_cvs',
          title: 'Management CVs',
          description: 'CVs of key management personnel and their qualifications',
          category: 'personal',
          isRequired: true,
          priority: 'medium',
          estimatedTime: '2-3 days',
          i18nKey: 'requirements.managementCVs',
          sources: ['Austrian Banking Guidelines']
        }
      ]
    },
    equity: {
      targetGroup: 'sme',
      fundingType: 'equity',
      description: 'Additional documents you must provide for equity investment',
      i18nKey: 'requirements.sme.equity',
      requirements: [
        {
          id: 'corporate_docs',
          title: 'Corporate Documents',
          description: 'Complete corporate documentation including shareholder agreements',
          category: 'legal',
          isRequired: true,
          priority: 'critical',
          estimatedTime: '1-2 weeks',
          i18nKey: 'requirements.corporateDocs',
          sources: ['Austrian Corporate Law', 'VC Due Diligence Standards']
        },
        {
          id: 'financial_due_diligence',
          title: 'Financial Due Diligence Pack',
          description: 'Complete financial due diligence package with audited statements',
          category: 'financial',
          isRequired: true,
          priority: 'critical',
          estimatedTime: '2-4 weeks',
          cost: 5000,
          i18nKey: 'requirements.financialDueDiligence',
          sources: ['VC Due Diligence Standards']
        },
        {
          id: 'market_due_diligence',
          title: 'Market Due Diligence',
          description: 'Independent market analysis and competitive positioning',
          category: 'business',
          isRequired: true,
          priority: 'high',
          estimatedTime: '3-4 weeks',
          cost: 3000,
          i18nKey: 'requirements.marketDueDiligence',
          sources: ['VC Due Diligence Standards']
        },
        {
          id: 'technical_due_diligence',
          title: 'Technical Due Diligence',
          description: 'Technical assessment of products, services, and IP',
          category: 'technical',
          isRequired: true,
          priority: 'high',
          estimatedTime: '2-3 weeks',
          cost: 2000,
          i18nKey: 'requirements.technicalDueDiligence',
          sources: ['VC Due Diligence Standards']
        }
      ]
    },
    visa: {
      targetGroup: 'sme',
      fundingType: 'visa',
      description: 'Additional documents you must provide for RWR visa applications',
      i18nKey: 'requirements.sme.visa',
      requirements: [
        {
          id: 'passport',
          title: 'Valid Passport',
          description: 'Passport valid for at least 2 years with at least 2 blank pages',
          category: 'personal',
          isRequired: true,
          priority: 'critical',
          estimatedTime: '2-8 weeks',
          i18nKey: 'requirements.passport',
          sources: ['Austrian Immigration Law']
        },
        {
          id: 'birth_certificate',
          title: 'Birth Certificate',
          description: 'Official birth certificate with apostille or legalization',
          category: 'personal',
          isRequired: true,
          priority: 'critical',
          estimatedTime: '2-4 weeks',
          i18nKey: 'requirements.birthCertificate',
          sources: ['Austrian Immigration Law']
        },
        {
          id: 'accommodation_proof',
          title: 'Accommodation Proof',
          description: 'Proof of accommodation in Austria (rental agreement or property ownership)',
          category: 'personal',
          isRequired: true,
          priority: 'critical',
          estimatedTime: '1-2 weeks',
          i18nKey: 'requirements.accommodationProof',
          sources: ['Austrian Immigration Law']
        },
        {
          id: 'health_insurance',
          title: 'Health Insurance',
          description: 'Comprehensive health insurance coverage in Austria',
          category: 'personal',
          isRequired: true,
          priority: 'critical',
          estimatedTime: '1 week',
          cost: 200,
          i18nKey: 'requirements.healthInsurance',
          sources: ['Austrian Health Insurance Law']
        },
        {
          id: 'funds_proof',
          title: 'Proof of Funds',
          description: 'Bank statements proving €30,000+ available funds',
          category: 'financial',
          isRequired: true,
          priority: 'critical',
          estimatedTime: '1 week',
          i18nKey: 'requirements.fundsProof',
          sources: ['RWR Visa Requirements']
        }
      ]
    }
  },
  advisors: {
    grants: {
      targetGroup: 'advisors',
      fundingType: 'grants',
      description: 'Additional documents your clients must provide for grant applications',
      i18nKey: 'requirements.advisors.grants',
      requirements: [
        {
          id: 'client_company_registration',
          title: 'Client Company Registration',
          description: 'Client\'s company registration documents (Firmenbuchauszug)',
          category: 'legal',
          isRequired: true,
          priority: 'critical',
          estimatedTime: '1-2 weeks',
          i18nKey: 'requirements.clientCompanyRegistration',
          sources: ['Austrian Commercial Register', 'WKO Guidelines']
        },
        {
          id: 'client_financial_health',
          title: 'Client Financial Health Form',
          description: 'Client\'s attested financial health form from tax consultant',
          category: 'financial',
          isRequired: true,
          priority: 'critical',
          estimatedTime: '1 week',
          cost: 200,
          i18nKey: 'requirements.clientFinancialHealth',
          sources: ['FFG Guidelines', 'Austrian Tax Consultant Association']
        },
        {
          id: 'client_credit_rating',
          title: 'Client Credit Rating',
          description: 'Client\'s credit rating report from KSV1870',
          category: 'financial',
          isRequired: true,
          priority: 'high',
          estimatedTime: '3-5 days',
          cost: 50,
          i18nKey: 'requirements.clientCreditRating',
          sources: ['KSV1870', 'FFG Requirements']
        },
        {
          id: 'client_team_cvs',
          title: 'Client Team CVs',
          description: 'Client\'s team member CVs with qualifications',
          category: 'personal',
          isRequired: true,
          priority: 'high',
          estimatedTime: '2-3 days',
          i18nKey: 'requirements.clientTeamCVs',
          sources: ['FFG Guidelines', 'Horizon Europe Requirements']
        }
      ]
    },
    bankLoans: {
      targetGroup: 'advisors',
      fundingType: 'bankLoans',
      description: 'Additional documents your clients must provide for bank loan applications',
      i18nKey: 'requirements.advisors.bankLoans',
      requirements: [
        {
          id: 'client_financial_statements',
          title: 'Client Financial Statements',
          description: 'Client\'s 3-year audited financial statements',
          category: 'financial',
          isRequired: true,
          priority: 'critical',
          estimatedTime: '1-2 weeks',
          i18nKey: 'requirements.clientFinancialStatements',
          sources: ['Austrian Banking Standards']
        },
        {
          id: 'client_tax_statements',
          title: 'Client Tax Statements',
          description: 'Client\'s current tax office statements',
          category: 'financial',
          isRequired: true,
          priority: 'high',
          estimatedTime: '1 week',
          i18nKey: 'requirements.clientTaxStatements',
          sources: ['Austrian Tax Office']
        },
        {
          id: 'client_collateral',
          title: 'Client Collateral Documentation',
          description: 'Client\'s collateral list with valuations',
          category: 'financial',
          isRequired: true,
          priority: 'high',
          estimatedTime: '1-2 weeks',
          i18nKey: 'requirements.clientCollateral',
          sources: ['Austrian Banking Standards']
        }
      ]
    },
    equity: {
      targetGroup: 'advisors',
      fundingType: 'equity',
      description: 'Additional documents your clients must provide for equity investment',
      i18nKey: 'requirements.advisors.equity',
      requirements: [
        {
          id: 'client_corporate_docs',
          title: 'Client Corporate Documents',
          description: 'Client\'s complete corporate documentation',
          category: 'legal',
          isRequired: true,
          priority: 'critical',
          estimatedTime: '1-2 weeks',
          i18nKey: 'requirements.clientCorporateDocs',
          sources: ['Austrian Corporate Law', 'VC Due Diligence Standards']
        },
        {
          id: 'client_due_diligence',
          title: 'Client Due Diligence Pack',
          description: 'Client\'s complete due diligence package',
          category: 'financial',
          isRequired: true,
          priority: 'critical',
          estimatedTime: '2-4 weeks',
          cost: 5000,
          i18nKey: 'requirements.clientDueDiligence',
          sources: ['VC Due Diligence Standards']
        }
      ]
    },
    visa: {
      targetGroup: 'advisors',
      fundingType: 'visa',
      description: 'Additional documents your clients must provide for RWR visa applications',
      i18nKey: 'requirements.advisors.visa',
      requirements: [
        {
          id: 'client_personal_docs',
          title: 'Client Personal Documents',
          description: 'Client\'s passport, birth certificate, and personal identification',
          category: 'personal',
          isRequired: true,
          priority: 'critical',
          estimatedTime: '2-8 weeks',
          i18nKey: 'requirements.clientPersonalDocs',
          sources: ['Austrian Immigration Law']
        },
        {
          id: 'client_accommodation',
          title: 'Client Accommodation Proof',
          description: 'Client\'s proof of accommodation in Austria',
          category: 'personal',
          isRequired: true,
          priority: 'critical',
          estimatedTime: '1-2 weeks',
          i18nKey: 'requirements.clientAccommodation',
          sources: ['Austrian Immigration Law']
        },
        {
          id: 'client_funds',
          title: 'Client Funds Proof',
          description: 'Client\'s proof of €30,000+ available funds',
          category: 'financial',
          isRequired: true,
          priority: 'critical',
          estimatedTime: '1 week',
          i18nKey: 'requirements.clientFunds',
          sources: ['RWR Visa Requirements']
        }
      ]
    }
  },
  universities: {
    grants: {
      targetGroup: 'universities',
      fundingType: 'grants',
      description: 'Additional documents you must provide for research grant applications',
      i18nKey: 'requirements.universities.grants',
      requirements: [
        {
          id: 'institution_registration',
          title: 'Institution Registration',
          description: 'University or research institution registration and accreditation documents',
          category: 'legal',
          isRequired: true,
          priority: 'critical',
          estimatedTime: '1-2 weeks',
          i18nKey: 'requirements.institutionRegistration',
          sources: ['Horizon Europe Guidelines', 'FFG Requirements']
        },
        {
          id: 'consortium_agreement',
          title: 'Consortium Agreement',
          description: 'Consortium agreement for multi-partner research projects',
          category: 'legal',
          isRequired: true,
          priority: 'critical',
          estimatedTime: '2-4 weeks',
          i18nKey: 'requirements.consortiumAgreement',
          sources: ['Horizon Europe Guidelines']
        },
        {
          id: 'previous_projects',
          title: 'Previous Projects List',
          description: 'List of previous research projects and their outcomes',
          category: 'business',
          isRequired: true,
          priority: 'high',
          estimatedTime: '1-2 weeks',
          i18nKey: 'requirements.previousProjects',
          sources: ['Horizon Europe Guidelines', 'FFG Requirements']
        },
        {
          id: 'internal_cost_centers',
          title: 'Internal Cost Centers',
          description: 'University internal cost center documentation and approval',
          category: 'financial',
          isRequired: true,
          priority: 'high',
          estimatedTime: '1-2 weeks',
          i18nKey: 'requirements.internalCostCenters',
          sources: ['University Guidelines', 'FFG Requirements']
        },
        {
          id: 'research_team_cvs',
          title: 'Research Team CVs',
          description: 'Detailed CVs of all research team members with publications',
          category: 'personal',
          isRequired: true,
          priority: 'high',
          estimatedTime: '2-3 days',
          i18nKey: 'requirements.researchTeamCVs',
          sources: ['Horizon Europe Guidelines', 'FFG Requirements']
        }
      ]
    },
    bankLoans: {
      targetGroup: 'universities',
      fundingType: 'bankLoans',
      description: 'Additional documents you must provide for bank loan applications',
      i18nKey: 'requirements.universities.bankLoans',
      requirements: [
        {
          id: 'institution_financials',
          title: 'Institution Financial Statements',
          description: 'University financial statements and budget documentation',
          category: 'financial',
          isRequired: true,
          priority: 'critical',
          estimatedTime: '1-2 weeks',
          i18nKey: 'requirements.institutionFinancials',
          sources: ['Austrian Banking Standards', 'University Guidelines']
        },
        {
          id: 'project_approval',
          title: 'Project Approval',
          description: 'University internal project approval and budget allocation',
          category: 'legal',
          isRequired: true,
          priority: 'critical',
          estimatedTime: '2-4 weeks',
          i18nKey: 'requirements.projectApproval',
          sources: ['University Guidelines']
        }
      ]
    },
    equity: {
      targetGroup: 'universities',
      fundingType: 'equity',
      description: 'Additional documents you must provide for equity investment',
      i18nKey: 'requirements.universities.equity',
      requirements: [
        {
          id: 'spin_off_docs',
          title: 'Spin-off Documentation',
          description: 'University spin-off company formation and IP transfer documents',
          category: 'legal',
          isRequired: true,
          priority: 'critical',
          estimatedTime: '2-4 weeks',
          i18nKey: 'requirements.spinOffDocs',
          sources: ['University IP Policy', 'Austrian Corporate Law']
        },
        {
          id: 'ip_transfer',
          title: 'IP Transfer Agreement',
          description: 'Intellectual property transfer agreement from university to company',
          category: 'legal',
          isRequired: true,
          priority: 'critical',
          estimatedTime: '2-4 weeks',
          i18nKey: 'requirements.ipTransfer',
          sources: ['University IP Policy', 'Austrian IP Law']
        }
      ]
    },
    visa: {
      targetGroup: 'universities',
      fundingType: 'visa',
      description: 'Additional documents you must provide for RWR visa applications',
      i18nKey: 'requirements.universities.visa',
      requirements: [
        {
          id: 'researcher_credentials',
          title: 'Researcher Credentials',
          description: 'Academic credentials, research publications, and qualifications',
          category: 'personal',
          isRequired: true,
          priority: 'critical',
          estimatedTime: '1-2 weeks',
          i18nKey: 'requirements.researcherCredentials',
          sources: ['Austrian Immigration Law', 'Research Visa Guidelines']
        },
        {
          id: 'institution_support',
          title: 'Institution Support Letter',
          description: 'University support letter and research position confirmation',
          category: 'business',
          isRequired: true,
          priority: 'critical',
          estimatedTime: '1-2 weeks',
          i18nKey: 'requirements.institutionSupport',
          sources: ['Austrian Immigration Law']
        }
      ]
    }
  }
};

// Helper function to get requirements for a specific target group and funding type
export function getAdditionalRequirements(
  targetGroup: TargetGroup,
  fundingType: FundingType
): RequirementsMatrix {
  return additionalRequirements[targetGroup][fundingType];
}

// Helper function to get all requirements for a target group
export function getRequirementsForTargetGroup(targetGroup: TargetGroup): Record<FundingType, RequirementsMatrix> {
  return additionalRequirements[targetGroup];
}

// Helper function to get all requirements for a funding type
export function getRequirementsForFundingType(fundingType: FundingType): Record<TargetGroup, RequirementsMatrix> {
  const result: Record<TargetGroup, RequirementsMatrix> = {} as Record<TargetGroup, RequirementsMatrix>;
  
  Object.keys(additionalRequirements).forEach(targetGroup => {
    result[targetGroup as TargetGroup] = additionalRequirements[targetGroup as TargetGroup][fundingType];
  });
  
  return result;
}

// Helper function to get critical requirements only
export function getCriticalRequirements(
  targetGroup: TargetGroup,
  fundingType: FundingType
): AdditionalRequirement[] {
  const matrix = getAdditionalRequirements(targetGroup, fundingType);
  return matrix.requirements.filter(req => req.priority === 'critical');
}

// Helper function to get requirements by category
export function getRequirementsByCategory(
  targetGroup: TargetGroup,
  fundingType: FundingType,
  category: AdditionalRequirement['category']
): AdditionalRequirement[] {
  const matrix = getAdditionalRequirements(targetGroup, fundingType);
  return matrix.requirements.filter(req => req.category === category);
}
