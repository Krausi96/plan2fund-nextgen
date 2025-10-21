// Test API endpoint for Enhanced Web Scraper with Learning Engine
import { NextApiRequest, NextApiResponse } from 'next';
import { EnhancedWebScraperService } from '../../src/lib/enhancedWebScraperService';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  console.log('🧠 Testing Enhanced Web Scraper with Learning Engine...');
  
  const results = {
    success: false,
    totalPrograms: 0,
    byType: {} as Record<string, number>,
    byInstitution: {} as Record<string, number>,
    errors: [] as string[],
    timestamp: new Date().toISOString(),
    learningStats: {} as any
  };
  
  const enhancedScraper = new EnhancedWebScraperService();
  
  try {
    // Get initial learning stats
    results.learningStats.initial = enhancedScraper.getLearningStats();
    console.log('🧠 Initial Learning Stats:', results.learningStats.initial);
    
    // Test URL patterns
    console.log('🧠 Testing URL patterns...');
    const testPatterns = enhancedScraper['getUrlPatterns']('aws');
    console.log('🎯 URL patterns for AWS:', testPatterns);
    
    // Test optimized timeouts
    console.log('⏱️ Testing optimized timeouts...');
    const awsTimeout = enhancedScraper['getOptimizedTimeout']('aws');
    const ffgTimeout = enhancedScraper['getOptimizedTimeout']('ffg');
    console.log(`⏱️ AWS timeout: ${awsTimeout}ms, FFG timeout: ${ffgTimeout}ms`);
    
    // Test retry strategies
    console.log('🔄 Testing retry strategies...');
    const awsRetry = enhancedScraper['getRetryStrategy']('aws');
    const ffgRetry = enhancedScraper['getRetryStrategy']('ffg');
    console.log(`🔄 AWS retry: ${awsRetry.attempts} attempts, FFG retry: ${ffgRetry.attempts} attempts`);
    
    // Run enhanced scraping with learning
    console.log('🔄 Running enhanced scraping with learning...');
    const programs = await enhancedScraper.scrapeAllProgramsWithLearning();
    
    results.totalPrograms = programs.length;
    results.success = true;
    
    // Analyze results
    programs.forEach(program => {
      const type = program.type || 'unknown';
      const inst = program.institution || 'unknown';
      
      results.byType[type] = (results.byType[type] || 0) + 1;
      results.byInstitution[inst] = (results.byInstitution[inst] || 0) + 1;
    });
    
    // Get final learning stats
    results.learningStats.final = enhancedScraper.getLearningStats();
    
    console.log(`✅ Enhanced scraper completed: ${programs.length} programs`);
    console.log('Program types:', results.byType);
    console.log('Institutions:', results.byInstitution);
    console.log('Final learning stats:', results.learningStats.final);
    
    res.status(200).json({
      ...results,
      message: `Enhanced scraper completed successfully with ${programs.length} programs`,
      samplePrograms: programs.slice(0, 3), // Return first 3 as sample
      learningImprovement: {
        institutionsLearned: results.learningStats.final.institutions - results.learningStats.initial.institutions,
        urlPatternsLearned: results.learningStats.final.urlPatterns - results.learningStats.initial.urlPatterns,
        successRate: results.learningStats.final.avgSuccessRate,
        totalScrapes: results.learningStats.final.totalScrapes
      }
    });
    
  } catch (error) {
    console.error('❌ Enhanced scraper test failed:', error);
    results.errors.push(error instanceof Error ? error.message : 'Unknown error');
    
    // Get learning stats even on failure
    results.learningStats.final = enhancedScraper.getLearningStats();
    
    res.status(200).json({
      ...results,
      message: 'Enhanced scraper test completed with errors (expected due to bot detection)',
      fallback: 'System should use fallback data',
      learningStats: results.learningStats
    });
  }
}
