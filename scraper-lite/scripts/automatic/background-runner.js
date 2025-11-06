#!/usr/bin/env node
/**
 * Background Runner - Runs the scraper autonomously in the background
 * 
 * Features:
 * - Continuous operation
 * - Automatic restart on errors
 * - Logging to file
 * - Health checks
 * - Graceful shutdown
 */

const path = require('path');
const fs = require('fs');
const { autoCycle } = require('./auto-cycle.js');

// Configuration
const LOG_DIR = path.join(__dirname, '../../../logs');
const LOG_FILE = path.join(LOG_DIR, 'background-runner.log');
const ERROR_LOG_FILE = path.join(LOG_DIR, 'background-runner-errors.log');
const MAX_CONSECUTIVE_ERRORS = 5;
const CYCLE_DELAY_MS = 30000; // 30 seconds between cycles
const HEALTH_CHECK_INTERVAL_MS = 300000; // 5 minutes

// Ensure log directory exists
if (!fs.existsSync(LOG_DIR)) {
  fs.mkdirSync(LOG_DIR, { recursive: true });
}

// Logging helper
function log(message, isError = false) {
  const timestamp = new Date().toISOString();
  const logMessage = `[${timestamp}] ${message}\n`;
  
  // Console output
  if (isError) {
    console.error(logMessage.trim());
  } else {
    console.log(logMessage.trim());
  }
  
  // File output
  const logFile = isError ? ERROR_LOG_FILE : LOG_FILE;
  fs.appendFileSync(logFile, logMessage, 'utf8');
}

// Health check
let lastCycleTime = Date.now();
let consecutiveErrors = 0;

function healthCheck() {
  const timeSinceLastCycle = Date.now() - lastCycleTime;
  
  if (timeSinceLastCycle > HEALTH_CHECK_INTERVAL_MS * 2) {
    log(`⚠️  Health check: No cycle completed in ${Math.round(timeSinceLastCycle / 1000)}s`, true);
  }
  
  if (consecutiveErrors >= MAX_CONSECUTIVE_ERRORS) {
    log(`❌ Health check: Too many consecutive errors (${consecutiveErrors}). Restarting...`, true);
    process.exit(1); // Exit and let process manager restart
  }
}

// Graceful shutdown
let isShuttingDown = false;

process.on('SIGINT', () => {
  log('⚠️  Received SIGINT, shutting down gracefully...');
  isShuttingDown = true;
  setTimeout(() => {
    log('❌ Force exit after timeout');
    process.exit(1);
  }, 30000);
});

process.on('SIGTERM', () => {
  log('⚠️  Received SIGTERM, shutting down gracefully...');
  isShuttingDown = true;
  setTimeout(() => {
    log('❌ Force exit after timeout');
    process.exit(1);
  }, 30000);
});

// Main loop
async function runBackground() {
  log('🚀 Background runner starting...');
  log(`📁 Logs: ${LOG_FILE}`);
  log(`📁 Error logs: ${ERROR_LOG_FILE}`);
  
  // Start health check interval
  const healthCheckInterval = setInterval(healthCheck, HEALTH_CHECK_INTERVAL_MS);
  
  while (!isShuttingDown) {
    try {
      log('🔄 Starting new cycle...');
      lastCycleTime = Date.now();
      consecutiveErrors = 0;
      
      // Add timeout to prevent infinite hanging (30 minutes max per cycle)
      const CYCLE_TIMEOUT_MS = 30 * 60 * 1000; // 30 minutes
      const cyclePromise = autoCycle();
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Cycle timeout after 30 minutes')), CYCLE_TIMEOUT_MS)
      );
      
      await Promise.race([cyclePromise, timeoutPromise]);
      
      log('✅ Cycle completed successfully');
      
      if (isShuttingDown) {
        break;
      }
      
      // Wait before next cycle
      log(`⏸️  Waiting ${CYCLE_DELAY_MS / 1000}s before next cycle...`);
      await new Promise(resolve => setTimeout(resolve, CYCLE_DELAY_MS));
      
    } catch (error) {
      consecutiveErrors++;
      log(`❌ Cycle error (${consecutiveErrors}/${MAX_CONSECUTIVE_ERRORS}): ${error.message}`, true);
      log(`Stack trace: ${error.stack}`, true);
      
      if (consecutiveErrors >= MAX_CONSECUTIVE_ERRORS) {
        log(`❌ Too many consecutive errors. Exiting...`, true);
        clearInterval(healthCheckInterval);
        process.exit(1);
      }
      
      // Wait before retry (exponential backoff)
      const backoffDelay = Math.min(CYCLE_DELAY_MS * Math.pow(2, consecutiveErrors - 1), 300000); // Max 5 minutes
      log(`⏸️  Waiting ${backoffDelay / 1000}s before retry...`);
      await new Promise(resolve => setTimeout(resolve, backoffDelay));
    }
  }
  
  clearInterval(healthCheckInterval);
  log('✅ Background runner stopped gracefully');
}

// Run if called directly
if (require.main === module) {
  runBackground().catch(err => {
    log(`❌ Fatal error: ${err.message}`, true);
    log(`Stack trace: ${err.stack}`, true);
    process.exit(1);
  });
}

module.exports = { runBackground };

