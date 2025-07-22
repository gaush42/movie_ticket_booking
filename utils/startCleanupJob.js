const cron = require('node-cron');
const { cleanupExpiredLocksJob } = require('../controllers/bookingController');

// Run cleanup every 5 minutes
const startCleanupJob = () => {
  cron.schedule('*/5 * * * *', async () => {
    console.log('Running seat lock cleanup job...');
    await cleanupExpiredLocksJob();
  });
  
  console.log('Seat lock cleanup job started - runs every 5 minutes');
};

module.exports = { startCleanupJob };