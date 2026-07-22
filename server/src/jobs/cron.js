const cron = require('node-cron');
const v8 = require('v8');
const { query } = require('../config/db');
const config = require('../config/env');
const logger = require('../utils/logger');

/**
 * Configure and schedule all application background cron jobs.
 */
function initCronJobs() {
  logger.info('⏰ Initializing background cron jobs...');

  // --- 1. Daily Activity Log Cleanup (Run at midnight every day) ---
  cron.schedule('0 0 * * *', async () => {
    const days = config.jobs.activityLogRetentionDays;
    logger.info(`Running daily cron: Cleanup activity logs older than ${days} days...`);

    try {
      const result = await query(
        "DELETE FROM activity_logs WHERE created_at < NOW() - ($1 * INTERVAL '1 day')",
        [days]
      );
      logger.info(`Daily cron complete: Purged ${result.rowCount} stale activity logs.`);
    } catch (err) {
      logger.error('Error executing activity log cleanup cron', { error: err.message });
    }
  });

  // --- 2. Hourly Expired Invite Cleanup (Run at minute 0 of every hour) ---
  cron.schedule('0 * * * *', async () => {
    logger.info('Running hourly cron: Cleanup expired workspace invites...');

    try {
      // workspace_invites table is designed to support the optional invite link feature
      const result = await query('DELETE FROM workspace_invites WHERE expires_at < NOW()');
      logger.info(`Hourly cron complete: Purged ${result.rowCount} expired invites.`);
    } catch (err) {
      if (err.message.includes('relation "workspace_invites" does not exist')) {
        logger.warn('Hourly cron skipped: workspace_invites table does not exist (invite link system is not implemented).');
      } else {
        logger.error('Error executing invite cleanup cron', { error: err.message });
      }
    }
  });

  // --- 3. 15-Minute Memory Monitoring & Alerting (Run every 15 minutes) ---
  cron.schedule('*/15 * * * *', () => {
    const memoryUsage = process.memoryUsage();
    const heapStats = v8.getHeapStatistics();

    const usedHeapMB = Math.round(heapStats.used_heap_size / 1024 / 1024 * 100) / 100;
    const limitHeapMB = Math.round(heapStats.heap_size_limit / 1024 / 1024 * 100) / 100;
    const heapUsedPercent = (heapStats.used_heap_size / heapStats.heap_size_limit) * 100;

    const rssMB = Math.round(memoryUsage.rss / 1024 / 1024 * 100) / 100;

    logger.info('Memory status report:', {
      rss: `${rssMB} MB`,
      heapUsed: `${usedHeapMB} MB`,
      heapLimit: `${limitHeapMB} MB`,
      heapPercent: `${Math.round(heapUsedPercent * 100) / 100}%`
    });

    const threshold = config.jobs.memoryWarningThresholdPercent;
    if (heapUsedPercent >= threshold) {
      logger.warn(`⚠️ High Memory Usage Warning: V8 heap is at ${Math.round(heapUsedPercent * 100) / 100}% (Threshold: ${threshold}%)`, {
        heapUsedMB: usedHeapMB,
        heapLimitMB: limitHeapMB,
        suggestion: 'Consider scaling the instance or checking for memory leaks.'
      });
    }
  });
}

// Automatically initialize when required
initCronJobs();

module.exports = {
  initCronJobs
};
