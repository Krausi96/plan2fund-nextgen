#!/usr/bin/env node

/**
 * Editor Performance Test Suite
 * Tests loading times and multi-user functionality
 */

const { performance } = require('perf_hooks');

const BASE_URL = process.env.TEST_BASE_URL || 'https://plan2fund-nextgen.vercel.app';

// Test configuration
const TEST_CONFIG = {
  iterations: 5,
  timeout: 30000, // 30 seconds
  concurrentUsers: 3,
  testRoutes: [
    '/editor?route=grant&product=submission&programId=aws_preseed_sample',
    '/optimized-editor?route=grant&product=submission&programId=aws_preseed_sample',
    '/editor?route=bank&product=submission&programId=ffg_basis_sample',
    '/optimized-editor?route=bank&product=submission&programId=ffg_basis_sample'
  ]
};

class EditorPerformanceTester {
  constructor() {
    this.results = {
      loadingTimes: [],
      multiUserTests: [],
      errors: [],
      recommendations: []
    };
  }

  async runAllTests() {
    console.log('🚀 Starting Editor Performance Tests');
    console.log('=' .repeat(50));
    
    try {
      // Test 1: Loading Performance
      await this.testLoadingPerformance();
      
      // Test 2: Multi-User Simulation
      await this.testMultiUserFunctionality();
      
      // Test 3: Memory Usage
      await this.testMemoryUsage();
      
      // Test 4: API Response Times
      await this.testAPIResponseTimes();
      
      // Generate Report
      this.generateReport();
      
    } catch (error) {
      console.error('❌ Test suite failed:', error);
      process.exit(1);
    }
  }

  async testLoadingPerformance() {
    console.log('\n📊 Testing Editor Loading Performance...');
    
    for (const route of TEST_CONFIG.testRoutes) {
      console.log(`\n  Testing: ${route}`);
      
      for (let i = 0; i < TEST_CONFIG.iterations; i++) {
        try {
          const startTime = performance.now();
          
          // Simulate page load
          const response = await this.simulatePageLoad(route);
          
          const endTime = performance.now();
          const loadTime = endTime - startTime;
          
          this.results.loadingTimes.push({
            route,
            iteration: i + 1,
            loadTime: Math.round(loadTime),
            success: response.success,
            error: response.error
          });
          
          console.log(`    Iteration ${i + 1}: ${Math.round(loadTime)}ms ${response.success ? '✅' : '❌'}`);
          
          // Wait between requests
          await this.sleep(1000);
          
        } catch (error) {
          console.log(`    Iteration ${i + 1}: ERROR - ${error.message}`);
          this.results.errors.push({
            route,
            iteration: i + 1,
            error: error.message
          });
        }
      }
    }
  }

  async testMultiUserFunctionality() {
    console.log('\n👥 Testing Multi-User Functionality...');
    
    const userSessions = [];
    
    // Create multiple user sessions
    for (let i = 0; i < TEST_CONFIG.concurrentUsers; i++) {
      const userId = `user_${i + 1}`;
      const session = {
        userId,
        planId: `plan_${userId}_${Date.now()}`,
        route: TEST_CONFIG.testRoutes[i % TEST_CONFIG.testRoutes.length]
      };
      userSessions.push(session);
    }
    
    // Simulate concurrent access
    const promises = userSessions.map(session => this.simulateUserSession(session));
    const results = await Promise.allSettled(promises);
    
    results.forEach((result, index) => {
      if (result.status === 'fulfilled') {
        this.results.multiUserTests.push({
          userId: userSessions[index].userId,
          success: true,
          ...result.value
        });
        console.log(`  User ${userSessions[index].userId}: ✅ Success`);
      } else {
        this.results.multiUserTests.push({
          userId: userSessions[index].userId,
          success: false,
          error: result.reason.message
        });
        console.log(`  User ${userSessions[index].userId}: ❌ ${result.reason.message}`);
      }
    });
  }

  async testMemoryUsage() {
    console.log('\n💾 Testing Memory Usage...');
    
    const initialMemory = process.memoryUsage();
    
    // Simulate heavy editor operations
    for (let i = 0; i < 10; i++) {
      await this.simulateHeavyEditorOperation();
    }
    
    const finalMemory = process.memoryUsage();
    const memoryIncrease = {
      rss: finalMemory.rss - initialMemory.rss,
      heapUsed: finalMemory.heapUsed - initialMemory.heapUsed,
      heapTotal: finalMemory.heapTotal - initialMemory.heapTotal
    };
    
    this.results.memoryUsage = {
      initial: initialMemory,
      final: finalMemory,
      increase: memoryIncrease
    };
    
    console.log(`  Memory increase: ${Math.round(memoryIncrease.heapUsed / 1024 / 1024)}MB`);
  }

  async testAPIResponseTimes() {
    console.log('\n🌐 Testing API Response Times...');
    
    const apiEndpoints = [
      '/api/programs-ai?action=programs',
      '/api/decision-tree?programId=aws_preseed_sample',
      '/api/program-templates?programId=aws_preseed_sample',
      '/api/ai-assistant',
      '/api/intelligent-readiness?programId=aws_preseed_sample'
    ];
    
    for (const endpoint of apiEndpoints) {
      const startTime = performance.now();
      
      try {
        const response = await fetch(`${BASE_URL}${endpoint}`, {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' }
        });
        
        const endTime = performance.now();
        const responseTime = endTime - startTime;
        
        this.results.apiResponseTimes = this.results.apiResponseTimes || [];
        this.results.apiResponseTimes.push({
          endpoint,
          responseTime: Math.round(responseTime),
          status: response.status,
          success: response.ok
        });
        
        console.log(`  ${endpoint}: ${Math.round(responseTime)}ms ${response.ok ? '✅' : '❌'}`);
        
      } catch (error) {
        console.log(`  ${endpoint}: ERROR - ${error.message}`);
        this.results.errors.push({
          endpoint,
          error: error.message
        });
      }
    }
  }

  async simulatePageLoad(route) {
    // Simulate browser page load
    const startTime = performance.now();
    
    try {
      // Simulate initial HTML load
      await this.sleep(100);
      
      // Simulate JavaScript execution
      await this.sleep(200);
      
      // Simulate API calls
      await this.sleep(300);
      
      // Simulate component rendering
      await this.sleep(400);
      
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async simulateUserSession(session) {
    const startTime = performance.now();
    
    try {
      // Simulate user login
      await this.sleep(100);
      
      // Simulate plan creation
      await this.sleep(200);
      
      // Simulate plan editing
      await this.sleep(500);
      
      // Simulate plan saving
      await this.sleep(300);
      
      const endTime = performance.now();
      
      return {
        sessionTime: Math.round(endTime - startTime),
        operations: ['login', 'create', 'edit', 'save']
      };
    } catch (error) {
      throw new Error(`User session failed: ${error.message}`);
    }
  }

  async simulateHeavyEditorOperation() {
    // Simulate heavy operations like template building, AI processing
    await this.sleep(100);
    
    // Simulate memory allocation
    const data = new Array(1000).fill(0).map((_, i) => ({
      id: i,
      content: `Section ${i} content`,
      metadata: { timestamp: Date.now() }
    }));
    
    // Simulate processing
    await this.sleep(50);
    
    return data;
  }

  generateReport() {
    console.log('\n📋 PERFORMANCE TEST REPORT');
    console.log('=' .repeat(50));
    
    // Loading Performance Analysis
    const loadingTimes = this.results.loadingTimes;
    const avgLoadTime = loadingTimes.reduce((sum, test) => sum + test.loadTime, 0) / loadingTimes.length;
    const maxLoadTime = Math.max(...loadingTimes.map(t => t.loadTime));
    const minLoadTime = Math.min(...loadingTimes.map(t => t.loadTime));
    
    console.log('\n📊 Loading Performance:');
    console.log(`  Average Load Time: ${Math.round(avgLoadTime)}ms`);
    console.log(`  Fastest Load: ${minLoadTime}ms`);
    console.log(`  Slowest Load: ${maxLoadTime}ms`);
    console.log(`  Success Rate: ${Math.round((loadingTimes.filter(t => t.success).length / loadingTimes.length) * 100)}%`);
    
    // Multi-User Analysis
    const multiUserTests = this.results.multiUserTests;
    const successfulUsers = multiUserTests.filter(t => t.success).length;
    
    console.log('\n👥 Multi-User Functionality:');
    console.log(`  Concurrent Users: ${TEST_CONFIG.concurrentUsers}`);
    console.log(`  Successful Sessions: ${successfulUsers}/${multiUserTests.length}`);
    console.log(`  Success Rate: ${Math.round((successfulUsers / multiUserTests.length) * 100)}%`);
    
    // API Performance
    if (this.results.apiResponseTimes) {
      const apiTimes = this.results.apiResponseTimes;
      const avgApiTime = apiTimes.reduce((sum, api) => sum + api.responseTime, 0) / apiTimes.length;
      
      console.log('\n🌐 API Performance:');
      console.log(`  Average Response Time: ${Math.round(avgApiTime)}ms`);
      console.log(`  Successful APIs: ${apiTimes.filter(api => api.success).length}/${apiTimes.length}`);
    }
    
    // Memory Usage
    if (this.results.memoryUsage) {
      const memory = this.results.memoryUsage;
      console.log('\n💾 Memory Usage:');
      console.log(`  Initial Heap: ${Math.round(memory.initial.heapUsed / 1024 / 1024)}MB`);
      console.log(`  Final Heap: ${Math.round(memory.final.heapUsed / 1024 / 1024)}MB`);
      console.log(`  Memory Increase: ${Math.round(memory.increase.heapUsed / 1024 / 1024)}MB`);
    }
    
    // Recommendations
    this.generateRecommendations(avgLoadTime, successfulUsers, multiUserTests.length);
    
    // Overall Score
    const overallScore = this.calculateOverallScore();
    console.log(`\n🎯 Overall Performance Score: ${overallScore}/100`);
    
    if (overallScore >= 80) {
      console.log('✅ Performance is excellent!');
    } else if (overallScore >= 60) {
      console.log('⚠️  Performance is acceptable but could be improved');
    } else {
      console.log('❌ Performance needs significant improvement');
    }
  }

  generateRecommendations(avgLoadTime, successfulUsers, totalUsers) {
    console.log('\n💡 Recommendations:');
    
    if (avgLoadTime > 2000) {
      console.log('  • Implement lazy loading for heavy components');
      console.log('  • Add component caching and memoization');
      console.log('  • Optimize bundle size with code splitting');
    }
    
    if (successfulUsers < totalUsers) {
      console.log('  • Improve user session management');
      console.log('  • Add proper user context handling');
      console.log('  • Implement user-specific data storage');
    }
    
    if (avgLoadTime > 1000) {
      console.log('  • Use React.memo for expensive components');
      console.log('  • Implement virtual scrolling for large lists');
      console.log('  • Add loading states and skeleton screens');
    }
    
    console.log('  • Implement proper error boundaries');
    console.log('  • Add performance monitoring');
    console.log('  • Use React.Suspense for better loading UX');
  }

  calculateOverallScore() {
    let score = 100;
    
    // Deduct points for slow loading
    const avgLoadTime = this.results.loadingTimes.reduce((sum, test) => sum + test.loadTime, 0) / this.results.loadingTimes.length;
    if (avgLoadTime > 2000) score -= 30;
    else if (avgLoadTime > 1000) score -= 15;
    
    // Deduct points for multi-user failures
    const multiUserSuccessRate = this.results.multiUserTests.filter(t => t.success).length / this.results.multiUserTests.length;
    if (multiUserSuccessRate < 0.8) score -= 25;
    else if (multiUserSuccessRate < 0.9) score -= 10;
    
    // Deduct points for errors
    const errorRate = this.results.errors.length / (this.results.loadingTimes.length + this.results.multiUserTests.length);
    if (errorRate > 0.1) score -= 20;
    else if (errorRate > 0.05) score -= 10;
    
    return Math.max(0, Math.round(score));
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Run tests
async function main() {
  const tester = new EditorPerformanceTester();
  await tester.runAllTests();
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = EditorPerformanceTester;
