// Quick Test API endpoint for Enhanced Web Scraper (Development Mode)
// This version has timeout controls and performance limits

import { NextApiRequest, NextApiResponse } from 'next';
import { EnhancedWebScraperService } from '../../src/lib/enhancedWebScraperService';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  console.log('⚡ Quick Testing Enhanced Web Scraper (Dev Mode)...');
  
  const startTime = Date.now();
  const results = {
    success: false,
    totalPrograms: 0,
    byType: {} as Record<string, number>,
    byInstitution: {} as Record<string, number>,
    errors: [] as string[],
    timestamp: new Date().toISOString(),
    learningStats: {} as any,
    performance: {} as any,
    learningMode: 'quick_dev'
  };
  
  const enhancedScraper = new EnhancedWebScraperService();
  
  // Set a timeout for the entire operation
  const operationTimeout = setTimeout(() => {
    console.log('⏰ Quick test timeout reached (45 seconds)');
    res.status(200).json({
      ...results,
      message: 'Quick test completed with timeout (normal for development)',
      timeout: true,
      runtime: Date.now() - startTime,
      learningMode: 'quick_dev_timeout'
    });
  }, 45000); // 45 second timeout
  
  try {
    // Get initial learning stats
    results.learningStats.initial = enhancedScraper.getLearningStats();
    console.log('🧠 Initial Learning Stats:', results.learningStats.initial);
    
    // Test only 2 institutions in quick mode
    console.log('⚡ Quick mode: Testing only AWS and FFG...');
    
    // Create a quick test version of the scraper
    const quickPrograms = await enhancedScraper.scrapeAllProgramsWithLearningQuick();
    
    results.totalPrograms = quickPrograms.length;
    results.success = true;
    
    // Analyze results
    quickPrograms.forEach(program => {
      const type = program.type || 'unknown';
      const inst = program.institution || 'unknown';
      
      results.byType[type] = (results.byType[type] || 0) + 1;
      results.byInstitution[inst] = (results.byInstitution[inst] || 0) + 1;
    });
    
    // Get final learning stats
    results.learningStats.final = enhancedScraper.getLearningStats();
    
    // Calculate performance metrics
    const runtime = Date.now() - startTime;
    results.performance = {
      runtime,
      avgResponseTime: runtime / Math.max(quickPrograms.length, 1),
      totalAttempts: quickPrograms.length,
      successRate: quickPrograms.length > 0 ? 1 : 0,
      pdfsParsed: 0, // Quick mode skips PDF parsing
      deepCrawls: 0, // Quick mode skips deep crawling
      learningMode: 'quick_dev'
    };
    
    console.log(`⚡ Quick test completed: ${quickPrograms.length} programs in ${runtime}ms`);
    console.log('Program types:', results.byType);
    console.log('Institutions:', results.byInstitution);
    
    clearTimeout(operationTimeout);
    
    res.status(200).json({
      ...results,
      message: `Quick test completed successfully with ${quickPrograms.length} programs`,
      samplePrograms: quickPrograms.slice(0, 2), // Return first 2 as sample
      learningImprovement: {
        institutionsLearned: results.learningStats.final.institutions - results.learningStats.initial.institutions,
        urlPatternsLearned: results.learningStats.final.urlPatterns - results.learningStats.initial.urlPatterns,
        successRate: results.learningStats.final.avgSuccessRate,
        totalScrapes: results.learningStats.final.totalScrapes
      }
    });
    
  } catch (error) {
    clearTimeout(operationTimeout);
    console.error('❌ Quick test failed:', error);
    results.errors.push(error instanceof Error ? error.message : 'Unknown error');
    
    // Get learning stats even on failure
    results.learningStats.final = enhancedScraper.getLearningStats();
    
    const runtime = Date.now() - startTime;
    results.performance = {
      runtime,
      avgResponseTime: 0,
      totalAttempts: 0,
      successRate: 0,
      pdfsParsed: 0,
      deepCrawls: 0,
      learningMode: 'quick_dev_error'
    };
    
    res.status(200).json({
      ...results,
      message: 'Quick test completed with errors (expected in dev mode)',
      fallback: 'System should use fallback data',
      learningStats: results.learningStats,
      runtime
    });
  }
}
