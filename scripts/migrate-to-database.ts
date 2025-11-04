/**
 * Migration script: Move localStorage data to database
 * Run this after setting up the database schema
 */
import { getPool } from '../scraper-lite/src/db/neon-client';
import { findUserByEmail, createUser } from '../shared/db/user-repository';

async function migrateLocalStorageToDatabase() {
  console.log('🔄 Starting migration from localStorage to database...\n');

  if (typeof window === 'undefined') {
    console.error('❌ This script must run in browser context (localStorage available)');
    return;
  }

  try {
    // Get user profile from localStorage
    const profileStr = localStorage.getItem('pf_user_profile');
    if (!profileStr) {
      console.log('ℹ️  No user profile found in localStorage');
      return;
    }

    const profile = JSON.parse(profileStr);
    console.log(`📧 Found profile for: ${profile.id}`);

    // Check if user already exists in database
    const existingUser = await findUserByEmail(profile.id);
    if (existingUser) {
      console.log('✅ User already exists in database');
      return;
    }

    // Create user in database (without password - they'll need to set one)
    const user = await createUser({
      email: profile.id,
      name: profile.name,
      segment: profile.segment
    });

    console.log(`✅ Created user in database with ID: ${user.id}`);

    // Migrate plans
    const plansStr = localStorage.getItem('userPlans');
    if (plansStr) {
      const plans = JSON.parse(plansStr);
      const pool = getPool();
      
      for (const plan of plans) {
        await pool.query(
          `INSERT INTO user_plans (user_id, client_id, title, status, program_type, progress, is_paid, paid_at, plan_data, created_at, updated_at, last_modified)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
           ON CONFLICT DO NOTHING`,
          [
            user.id,
            plan.clientId || null,
            plan.title,
            plan.status || 'draft',
            plan.programType || 'GRANT',
            plan.progress || 0,
            plan.isPaid || false,
            plan.paidAt || null,
            JSON.stringify(plan),
            plan.createdAt || new Date().toISOString(),
            plan.updatedAt || new Date().toISOString(),
            plan.lastModified || new Date().toISOString()
          ]
        );
      }
      console.log(`✅ Migrated ${plans.length} plans to database`);
    }

    // Migrate recommendations
    const recsStr = localStorage.getItem('userRecommendations');
    if (recsStr) {
      const recs = JSON.parse(recsStr);
      const pool = getPool();
      
      await pool.query(
        `INSERT INTO user_recommendations (user_id, client_id, session_id, recommendations, created_at)
         VALUES ($1, $2, $3, $4, $5)
         ON CONFLICT DO NOTHING`,
        [
          user.id,
          null,
          `migration_${Date.now()}`,
          JSON.stringify(recs),
          new Date().toISOString()
        ]
      );
      console.log(`✅ Migrated recommendations to database`);
    }

    console.log('\n✅ Migration complete!');
    console.log('⚠️  User will need to set a password on next login');
  } catch (error: any) {
    console.error('❌ Migration failed:', error.message);
  }
}

// Export for use in browser console or API endpoint
if (typeof window !== 'undefined') {
  (window as any).migrateToDatabase = migrateLocalStorageToDatabase;
}

export default migrateLocalStorageToDatabase;

