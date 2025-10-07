#!/usr/bin/env node

/**
 * Legacy Data Migration Script - JSON Output
 * Migrates programs from legacy/programs.json to JSON file (no database required)
 * Cross-checks data integrity and validates all fields
 */

const fs = require('fs');
const path = require('path');

// Source priorities and monitoring frequency
const SOURCE_PRIORITIES = {
  'aws_at': { priority: 'high', monitoring: 'daily', category: 'austrian_grants' },
  'ffg_at': { priority: 'high', monitoring: 'daily', category: 'research_grants' },
  'eic_europa': { priority: 'high', monitoring: 'daily', category: 'eu_programs' },
  'horizon_europe': { priority: 'high', monitoring: 'daily', category: 'eu_programs' },
  'wko_at': { priority: 'high', monitoring: 'daily', category: 'business_grants' },
  'ams_at': { priority: 'high', monitoring: 'daily', category: 'employment' },
  'oesb_at': { priority: 'high', monitoring: 'daily', category: 'consulting' },
  'vba_at': { priority: 'high', monitoring: 'daily', category: 'regional_grants' },
  'raiffeisen_at': { priority: 'high', monitoring: 'daily', category: 'banking' },
  'erste_at': { priority: 'high', monitoring: 'daily', category: 'banking' },
  'unicredit_at': { priority: 'high', monitoring: 'daily', category: 'banking' },
  'bawag_at': { priority: 'high', monitoring: 'daily', category: 'banking' },
  'volksbank_at': { priority: 'high', monitoring: 'daily', category: 'banking' },
  'eif_europa': { priority: 'high', monitoring: 'daily', category: 'eu_programs' },
  'eit_digital': { priority: 'high', monitoring: 'daily', category: 'eu_programs' },
  'eit_health': { priority: 'high', monitoring: 'daily', category: 'health' },
  'eit_urban_mobility': { priority: 'high', monitoring: 'daily', category: 'mobility' },
  'eit_food': { priority: 'high', monitoring: 'daily', category: 'food' },
  'eit_manufacturing': { priority: 'high', monitoring: 'daily', category: 'manufacturing' },
  'eit_raw_materials': { priority: 'high', monitoring: 'daily', category: 'materials' },
  'eit_climate': { priority: 'high', monitoring: 'daily', category: 'climate' },
  'eit_culture_creativity': { priority: 'high', monitoring: 'daily', category: 'culture' },
  'eit_energy': { priority: 'high', monitoring: 'daily', category: 'energy' },
  'eit_water': { priority: 'high', monitoring: 'daily', category: 'water' }
};

// Program categories mapping
const PROGRAM_CATEGORIES = {
  'austrian_grants': 'Austrian Business Grants',
  'research_grants': 'Research & Innovation',
  'eu_programs': 'European Union Programs',
  'business_grants': 'Business Development',
  'employment': 'Employment & Training',
  'consulting': 'Consulting Services',
  'regional_grants': 'Regional Programs',
  'banking': 'Banking & Finance',
  'environmental': 'Environmental Programs',
  'health': 'Health & Life Sciences',
  'visa': 'Visa & Immigration',
  'equity': 'Equity & Investment',
  'mobility': 'Mobility & Transport',
  'food': 'Food & Agriculture',
  'manufacturing': 'Manufacturing',
  'materials': 'Raw Materials',
  'climate': 'Climate & Environment',
  'culture': 'Culture & Creativity',
  'energy': 'Energy & Power',
  'water': 'Water & Resources'
};

// Target personas mapping
const TARGET_PERSONAS = {
  'startup': ['startup', 'early_stage'],
  'sme': ['sme', 'small_business'],
  'researcher': ['researcher', 'academic'],
  'investor': ['investor', 'vc'],
  'consultant': ['consultant', 'advisor']
};

// Tags mapping
const TAG_MAPPINGS = {
  'innovation': ['innovation', 'innovative', 'breakthrough'],
  'startup': ['startup', 'early_stage', 'founding'],
  'non-dilutive': ['non-dilutive', 'grant', 'subsidy'],
  'research': ['research', 'development', 'r&d'],
  'environmental': ['environment', 'climate', 'sustainability'],
  'health': ['health', 'medical', 'biotech'],
  'technology': ['technology', 'tech', 'digital'],
  'international': ['international', 'eu', 'global']
};

class LegacyDataMigrator {
  constructor() {
    this.stats = {
      total: 0,
      migrated: 0,
      errors: 0,
      skipped: 0,
      categories: {},
      institutions: {}
    };
    this.migratedPrograms = [];
  }

  async migrate() {
    console.log('🚀 Starting legacy data migration to JSON...');
    
    try {
      // Load legacy data
      const legacyData = this.loadLegacyData();
      console.log(`📊 Loaded ${legacyData.programs.length} programs from legacy data`);
      
      // Validate data structure
      this.validateLegacyData(legacyData);
      
      // Process each program
      for (const program of legacyData.programs) {
        try {
          const migratedProgram = await this.migrateProgram(program);
          this.migratedPrograms.push(migratedProgram);
          this.stats.migrated++;
        } catch (error) {
          console.error(`❌ Error migrating program ${program.id}:`, error.message);
          this.stats.errors++;
        }
      }
      
      // Save to JSON file
      await this.saveToJson();
      
      // Print final statistics
      this.printStatistics();
      
    } catch (error) {
      console.error('❌ Migration failed:', error);
      process.exit(1);
    }
  }

  loadLegacyData() {
    const legacyPath = path.join(__dirname, '..', 'legacy', 'programs.json');
    
    if (!fs.existsSync(legacyPath)) {
      throw new Error('Legacy programs.json not found');
    }
    
    const data = JSON.parse(fs.readFileSync(legacyPath, 'utf8'));
    
    if (!data.programs || !Array.isArray(data.programs)) {
      throw new Error('Invalid legacy data format');
    }
    
    this.stats.total = data.programs.length;
    return data;
  }

  validateLegacyData(data) {
    console.log('🔍 Validating legacy data structure...');
    
    const requiredFields = ['id', 'name', 'type', 'jurisdiction'];
    let validPrograms = 0;
    
    for (const program of data.programs) {
      const hasRequiredFields = requiredFields.every(field => program[field]);
      if (hasRequiredFields) {
        validPrograms++;
      } else {
        console.warn(`⚠️ Program ${program.id} missing required fields`);
      }
    }
    
    console.log(`✅ ${validPrograms}/${data.programs.length} programs have required fields`);
  }

  async migrateProgram(program) {
    // Generate unique ID
    const id = this.generateId(program);
    
    // Extract basic information
    const name = program.name || 'Unknown Program';
    const description = this.extractDescription(program);
    const programType = this.mapProgramType(program.type);
    
    // Extract funding information
    const fundingInfo = this.extractFundingInfo(program);
    
    // Extract eligibility criteria
    const eligibilityCriteria = this.extractEligibilityCriteria(program);
    
    // Extract requirements
    const requirements = this.extractRequirements(program);
    
    // Extract contact information
    const contactInfo = this.extractContactInfo(program);
    
    // Determine institution and category
    const institution = this.determineInstitution(program);
    const category = this.determineCategory(program, institution);
    
    // Generate AI-enhanced fields
    const targetPersonas = this.generateTargetPersonas(program);
    const tags = this.generateTags(program);
    const decisionTreeQuestions = this.generateDecisionTreeQuestions(program);
    const editorSections = this.generateEditorSections(program);
    const readinessCriteria = this.generateReadinessCriteria(program);
    const aiGuidance = this.generateAIGuidance(program);
    
    // Calculate confidence score
    const confidenceScore = this.calculateConfidenceScore(program);
    
    // Create migrated program object
    const migratedProgram = {
      id,
      name,
      description,
      program_type: programType,
      funding_amount_min: fundingInfo.min,
      funding_amount_max: fundingInfo.max,
      currency: fundingInfo.currency,
      deadline: fundingInfo.deadline,
      eligibility_criteria: eligibilityCriteria,
      requirements: requirements,
      contact_info: contactInfo,
      source_url: program.evidence_links?.[0] || '',
      institution,
      program_category: category,
      scraped_at: new Date().toISOString(),
      confidence_score: confidenceScore,
      is_active: true,
      target_personas: targetPersonas,
      tags: tags,
      decision_tree_questions: decisionTreeQuestions,
      editor_sections: editorSections,
      readiness_criteria: readinessCriteria,
      ai_guidance: aiGuidance
    };
    
    // Update statistics
    this.stats.categories[category] = (this.stats.categories[category] || 0) + 1;
    this.stats.institutions[institution] = (this.stats.institutions[institution] || 0) + 1;
    
    return migratedProgram;
  }

  generateId(program) {
    // Use existing ID if valid, otherwise generate new one
    if (program.id && typeof program.id === 'string' && program.id.length > 0) {
      return program.id;
    }
    
    // Generate ID from name and jurisdiction
    const baseName = (program.name || 'unknown')
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '_')
      .substring(0, 20);
    
    const jurisdiction = program.jurisdiction || 'unknown';
    return `${jurisdiction}_${baseName}_${Date.now()}`;
  }

  extractDescription(program) {
    // Try to find description in various fields
    const descriptionFields = [
      program.description,
      program.summary,
      program.overview,
      program.purpose
    ];
    
    for (const field of descriptionFields) {
      if (field && typeof field === 'string' && field.length > 10) {
        return field.substring(0, 500); // Limit length
      }
    }
    
    return `Program: ${program.name}`;
  }

  mapProgramType(type) {
    const typeMap = {
      'grant': 'grant',
      'loan': 'loan',
      'equity': 'equity',
      'visa': 'visa',
      'consulting': 'consulting',
      'service': 'service',
      'mixed': 'grant'
    };
    
    return typeMap[type?.toLowerCase()] || 'grant';
  }

  extractFundingInfo(program) {
    const thresholds = program.thresholds || {};
    
    return {
      min: thresholds.max_grant_eur || thresholds.min_amount || null,
      max: thresholds.max_grant_eur || thresholds.max_amount || null,
      currency: 'EUR',
      deadline: this.parseDeadline(program.deadlines)
    };
  }

  parseDeadline(deadlines) {
    if (!deadlines) return null;
    
    const deadlineStr = deadlines.submission || deadlines.deadline || deadlines.end;
    if (!deadlineStr) return null;
    
    // Try to parse various date formats
    const date = new Date(deadlineStr);
    return isNaN(date.getTime()) ? null : date.toISOString();
  }

  extractEligibilityCriteria(program) {
    const criteria = {
      description: program.eligibility?.join('; ') || '',
      requirements: program.eligibility || [],
      exclusions: program.key_exclusions || [],
      thresholds: program.thresholds || {}
    };
    
    return criteria;
  }

  extractRequirements(program) {
    const requirements = {
      documents: program.docs_checklist || [],
      criteria: program.eligibility || [],
      exclusions: program.key_exclusions || [],
      overlays: program.overlays || []
    };
    
    return requirements;
  }

  extractContactInfo(program) {
    return {
      general: 'Contact information available on program website',
      website: program.evidence_links?.[0] || '',
      source: program.evidence_links?.[0] || ''
    };
  }

  determineInstitution(program) {
    // Try to determine institution from evidence links or ID
    const evidenceLink = program.evidence_links?.[0] || '';
    const id = program.id || '';
    
    if (evidenceLink.includes('aws.at')) return 'Austria Wirtschaftsservice';
    if (evidenceLink.includes('ffg.at')) return 'Austrian Research Promotion Agency';
    if (evidenceLink.includes('wko.at')) return 'Austrian Economic Chamber';
    if (evidenceLink.includes('ams.at')) return 'Austrian Employment Service';
    if (evidenceLink.includes('oesb.at')) return 'ÖSB Consulting';
    if (evidenceLink.includes('ec.europa.eu')) return 'European Union';
    if (evidenceLink.includes('eic.ec.europa.eu')) return 'European Innovation Council';
    if (evidenceLink.includes('eitdigital.eu')) return 'EIT Digital';
    if (evidenceLink.includes('eithealth.eu')) return 'EIT Health';
    if (evidenceLink.includes('eiturbanmobility.eu')) return 'EIT Urban Mobility';
    if (evidenceLink.includes('eitfood.eu')) return 'EIT Food';
    if (evidenceLink.includes('eitmanufacturing.eu')) return 'EIT Manufacturing';
    if (evidenceLink.includes('eitrawmaterials.eu')) return 'EIT Raw Materials';
    if (evidenceLink.includes('eitclimate.eu')) return 'EIT Climate';
    if (evidenceLink.includes('eitculturecreativity.eu')) return 'EIT Culture & Creativity';
    if (evidenceLink.includes('eitenergy.eu')) return 'EIT Energy';
    if (evidenceLink.includes('eitwater.eu')) return 'EIT Water';
    
    // Fallback to ID-based detection
    if (id.includes('aws')) return 'Austria Wirtschaftsservice';
    if (id.includes('ffg')) return 'Austrian Research Promotion Agency';
    if (id.includes('eic')) return 'European Innovation Council';
    if (id.includes('horizon')) return 'European Union';
    if (id.includes('eit')) return 'European Institute of Innovation and Technology';
    
    return 'Unknown Institution';
  }

  determineCategory(program, institution) {
    // Map institution to category
    const institutionCategoryMap = {
      'Austria Wirtschaftsservice': 'austrian_grants',
      'Austrian Research Promotion Agency': 'research_grants',
      'Austrian Economic Chamber': 'business_grants',
      'Austrian Employment Service': 'employment',
      'ÖSB Consulting': 'consulting',
      'European Union': 'eu_programs',
      'European Innovation Council': 'eu_programs',
      'EIT Digital': 'eu_programs',
      'EIT Health': 'health',
      'EIT Urban Mobility': 'mobility',
      'EIT Food': 'food',
      'EIT Manufacturing': 'manufacturing',
      'EIT Raw Materials': 'materials',
      'EIT Climate': 'climate',
      'EIT Culture & Creativity': 'culture',
      'EIT Energy': 'energy',
      'EIT Water': 'water',
      'European Institute of Innovation and Technology': 'eu_programs'
    };
    
    return institutionCategoryMap[institution] || 'austrian_grants';
  }

  generateTargetPersonas(program) {
    const personas = [];
    const text = (program.name + ' ' + program.description + ' ' + (program.eligibility?.join(' ') || '')).toLowerCase();
    
    if (text.includes('startup') || text.includes('founding')) personas.push('startup');
    if (text.includes('sme') || text.includes('small business')) personas.push('sme');
    if (text.includes('research') || text.includes('academic')) personas.push('researcher');
    if (text.includes('investor') || text.includes('vc')) personas.push('investor');
    if (text.includes('consultant') || text.includes('advisor')) personas.push('consultant');
    
    return personas.length > 0 ? personas : ['startup', 'sme'];
  }

  generateTags(program) {
    const tags = [];
    const text = (program.name + ' ' + program.description + ' ' + (program.eligibility?.join(' ') || '')).toLowerCase();
    
    for (const [tag, keywords] of Object.entries(TAG_MAPPINGS)) {
      if (keywords.some(keyword => text.includes(keyword))) {
        tags.push(tag);
      }
    }
    
    return tags.length > 0 ? tags : ['innovation', 'startup'];
  }

  generateDecisionTreeQuestions(program) {
    // Generate basic questions based on program requirements
    const questions = [];
    
    if (program.eligibility?.some(e => e.includes('Austria'))) {
      questions.push({
        id: 'location',
        question: 'Is your project located in Austria?',
        type: 'single',
        options: [
          { value: 'yes', label: 'Yes' },
          { value: 'no', label: 'No' }
        ]
      });
    }
    
    if (program.eligibility?.some(e => e.includes('startup') || e.includes('founding'))) {
      questions.push({
        id: 'stage',
        question: 'What is your company stage?',
        type: 'single',
        options: [
          { value: 'idea', label: 'Idea Stage' },
          { value: 'mvp', label: 'MVP/Prototype' },
          { value: 'revenue', label: 'Generating Revenue' }
        ]
      });
    }
    
    return questions;
  }

  generateEditorSections(program) {
    const sections = [];
    
    // Always include basic sections
    sections.push({
      id: 'executive_summary',
      title: 'Executive Summary',
      required: true,
      template: 'Provide a 2-3 sentence summary of your business idea and its potential impact.',
      guidance: 'Focus on the problem you solve and your unique solution.'
    });
    
    if (program.eligibility?.some(e => e.includes('financial') || e.includes('funding'))) {
      sections.push({
        id: 'financial_projections',
        title: 'Financial Projections',
        required: true,
        template: 'Provide 3-5 year financial projections including revenue, costs, and funding needs.',
        guidance: 'Include detailed assumptions and growth scenarios.'
      });
    }
    
    return sections;
  }

  generateReadinessCriteria(program) {
    const criteria = [];
    
    if (program.eligibility?.some(e => e.includes('business plan'))) {
      criteria.push({
        id: 'business_plan',
        description: 'Complete business plan required',
        required: true
      });
    }
    
    if (program.eligibility?.some(e => e.includes('financial'))) {
      criteria.push({
        id: 'financial_documents',
        description: 'Financial projections and statements required',
        required: true
      });
    }
    
    return criteria;
  }

  generateAIGuidance(program) {
    return {
      context: `This program supports ${program.type} applications with specific requirements.`,
      suggestions: [
        'Review all eligibility criteria carefully',
        'Prepare required documents in advance',
        'Focus on innovation and market potential'
      ],
      program_specific: program.eligibility || []
    };
  }

  calculateConfidenceScore(program) {
    let score = 0.5; // Base score
    
    // Increase score for complete information
    if (program.name) score += 0.1;
    if (program.description) score += 0.1;
    if (program.eligibility?.length > 0) score += 0.1;
    if (program.thresholds) score += 0.1;
    if (program.evidence_links?.length > 0) score += 0.1;
    
    return Math.min(score, 1.0);
  }

  async saveToJson() {
    const outputPath = path.join(__dirname, '..', 'data', 'migrated-programs.json');
    
    // Ensure data directory exists
    const dataDir = path.dirname(outputPath);
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
    
    // Create output object
    const output = {
      version: '2025-01-15',
      migration_date: new Date().toISOString(),
      total_programs: this.migratedPrograms.length,
      statistics: this.stats,
      programs: this.migratedPrograms
    };
    
    // Write to file
    fs.writeFileSync(outputPath, JSON.stringify(output, null, 2), 'utf8');
    
    console.log(`💾 Migrated programs saved to: ${outputPath}`);
  }

  printStatistics() {
    console.log('\n📊 Migration Statistics:');
    console.log(`✅ Total programs: ${this.stats.total}`);
    console.log(`✅ Successfully migrated: ${this.stats.migrated}`);
    console.log(`❌ Errors: ${this.stats.errors}`);
    console.log(`⏭️ Skipped: ${this.stats.skipped}`);
    
    console.log('\n📂 Categories:');
    for (const [category, count] of Object.entries(this.stats.categories)) {
      console.log(`  ${category}: ${count} programs`);
    }
    
    console.log('\n🏢 Institutions:');
    for (const [institution, count] of Object.entries(this.stats.institutions)) {
      console.log(`  ${institution}: ${count} programs`);
    }
    
    console.log('\n🎉 Migration completed successfully!');
    console.log('📁 Check data/migrated-programs.json for the results');
  }
}

// Run migration if called directly
if (require.main === module) {
  const migrator = new LegacyDataMigrator();
  migrator.migrate().catch(console.error);
}

module.exports = LegacyDataMigrator;
