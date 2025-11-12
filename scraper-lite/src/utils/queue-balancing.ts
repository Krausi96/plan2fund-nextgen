/**
 * Automatic Queue Balancing
 * Adjusts quality scores based on success rates to improve queue fairness
 */

import { getPool } from '../../db/db';

interface InstitutionStats {
  institution: string;
  total: number;
  successful: number;
  failed: number;
  success_rate: number;
  avg_quality: number;
}

/**
 * Get institution statistics from scraping jobs
 */
export async function getInstitutionStats(): Promise<InstitutionStats[]> {
  const pool = getPool();
  
  const stats = await pool.query(`
    SELECT 
      CASE 
        WHEN url LIKE '%aws.at%' THEN 'AWS'
        WHEN url LIKE '%ffg.at%' THEN 'FFG'
        WHEN url LIKE '%wko.at%' THEN 'WKO'
        WHEN url LIKE '%bmk.gv.at%' THEN 'BMK'
        ELSE 'Other'
      END as institution,
      COUNT(*) as total,
      COUNT(CASE WHEN status = 'completed' THEN 1 END) as successful,
      COUNT(CASE WHEN status = 'failed' THEN 1 END) as failed,
      AVG(quality_score) as avg_quality
    FROM scraping_jobs
    WHERE created_at > NOW() - INTERVAL '7 days'
    GROUP BY institution
    HAVING COUNT(*) >= 5  -- Only adjust if we have enough data
    ORDER BY total DESC
  `);
  
  return stats.rows.map((row: any) => ({
    institution: row.institution,
    total: parseInt(row.total, 10),
    successful: parseInt(row.successful, 10),
    failed: parseInt(row.failed, 10),
    success_rate: row.successful > 0 ? row.successful / row.total : 0,
    avg_quality: parseFloat(row.avg_quality) || 50
  }));
}

/**
 * Automatically adjust quality scores based on success rates
 * Institutions with higher success rates get a small quality boost
 * This helps balance the queue and prevent bias
 */
export async function balanceQueueQualityScores(): Promise<number> {
  const pool = getPool();
  const stats = await getInstitutionStats();
  
  if (stats.length === 0) {
    return 0; // Not enough data
  }
  
  // Calculate average success rate
  const avgSuccessRate = stats.reduce((sum, s) => sum + s.success_rate, 0) / stats.length;
  
  let adjusted = 0;
  
  for (const stat of stats) {
    // Calculate quality adjustment based on success rate
    // If success rate is above average, give small boost (+5 to +15)
    // If success rate is below average, give small penalty (-5 to -15)
    const successDiff = stat.success_rate - avgSuccessRate;
    const qualityAdjustment = Math.round(successDiff * 30); // Max ±15 points
    const newQualityBoost = Math.max(-15, Math.min(15, qualityAdjustment));
    
    if (Math.abs(newQualityBoost) > 2) { // Only adjust if significant
      // Update queued URLs for this institution
      const institutionPattern = stat.institution === 'AWS' ? '%aws.at%' :
                                 stat.institution === 'FFG' ? '%ffg.at%' :
                                 stat.institution === 'WKO' ? '%wko.at%' :
                                 stat.institution === 'BMK' ? '%bmk.gv.at%' : null;
      
      if (institutionPattern) {
        const result = await pool.query(`
          UPDATE scraping_jobs
          SET quality_score = GREATEST(0, LEAST(100, quality_score + $1))
          WHERE status = 'queued'
            AND url LIKE $2
            AND quality_score IS NOT NULL
        `, [newQualityBoost, institutionPattern]);
        
        if (result.rowCount && result.rowCount > 0) {
          adjusted += result.rowCount;
          console.log(`   ✅ Adjusted ${result.rowCount} ${stat.institution} URLs: ${newQualityBoost > 0 ? '+' : ''}${newQualityBoost} quality (success rate: ${(stat.success_rate * 100).toFixed(1)}%)`);
        }
      }
    }
  }
  
  return adjusted;
}

/**
 * Run automatic queue balancing (called after scraping)
 */
export async function runQueueBalancing(): Promise<void> {
  console.log('\n⚖️  Automatic Queue Balancing...');
  
  try {
    const adjusted = await balanceQueueQualityScores();
    if (adjusted > 0) {
      console.log(`   ✅ Adjusted quality scores for ${adjusted} URLs based on success rates\n`);
    } else {
      console.log('   ℹ️  Not enough data for queue balancing (need 5+ URLs per institution)\n');
    }
  } catch (error: any) {
    console.warn(`   ⚠️  Queue balancing failed: ${error.message}\n`);
  }
}

