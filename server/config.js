const config = {
  port: process.env.PORT || '3000',
  prot: process.env.PROT || 'https',
  dialogStartUrl: process.env.POLLY_DIALOG_START_URL || 'https://localhost:3006/dialog/start',
  usageLimit: parseInt(process.env.POLLY_USAGE_LIMIT) || 1000000,
  checkInterval: parseInt(process.env.POLLY_CHECK_INTERVAL) || 10,
  updateInterval: parseInt(process.env.POLLY_UPDATE_INTERVAL) || 600,
  logdir: process.env.POLLY_LOGDIR || "log",
};

module.exports = config;