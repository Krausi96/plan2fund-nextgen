require('dotenv').config({ path: '.env.local' });

async function testCategorization() {
  console.log('🎯 AUTOMATIC CATEGORIZATION DEMONSTRATION');
  console.log('='.repeat(60));
  
  try {
    const { Pool } = require('pg');
    const pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: false
    });
    
    // First, let's trigger the categorization by running the scraper
    console.log('\n🔄 Running scraper to generate categorized requirements...');
    
    const response = await fetch('http://localhost:3000/api/scraper/run', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    });
    
    if (response.ok) {
      console.log('✅ Scraper completed successfully');
      
      // Now check the results
      console.log('\n📊 CHECKING CATEGORIZED REQUIREMENTS:');
      const result = await pool.query(`
        SELECT id, name, program_type, requirements, eligibility_criteria, categorized_requirements
        FROM programs 
        WHERE categorized_requirements IS NOT NULL 
        LIMIT 3
      `);
      
      if (result.rows.length > 0) {
        result.rows.forEach((program, i) => {
          console.log(`\nProgram ${i+1}: ${program.name}`);
          console.log(`Type: ${program.program_type}`);
          
          console.log('\n📋 ORIGINAL REQUIREMENTS:');
          console.log(JSON.stringify(program.requirements, null, 2));
          
          console.log('\n📋 ORIGINAL ELIGIBILITY:');
          console.log(JSON.stringify(program.eligibility_criteria, null, 2));
          
          console.log('\n🎯 AUTOMATICALLY CATEGORIZED:');
          console.log(JSON.stringify(program.categorized_requirements, null, 2));
        });
      } else {
        console.log('❌ No categorized requirements found. The categorization might not be working yet.');
        
        // Show what we have instead
        const fallback = await pool.query(`
          SELECT id, name, requirements, eligibility_criteria
          FROM programs 
          LIMIT 2
        `);
        
        console.log('\n📊 CURRENT DATA (without categorization):');
        fallback.rows.forEach((program, i) => {
          console.log(`\nProgram ${i+1}: ${program.name}`);
          console.log('Requirements:', JSON.stringify(program.requirements, null, 2));
          console.log('Eligibility:', JSON.stringify(program.eligibility_criteria, null, 2));
        });
      }
    } else {
      console.log('❌ Scraper failed:', await response.text());
    }
    
    await pool.end();
    
  } catch (error) {
    console.error('Error:', error.message);
  }
}

testCategorization();
