const winston = require('winston');
const Transport = require('winston-transport');
const https = require('https');

// Custom transport for Logtail using HTTP API
class LogtailTransport extends Transport {
  constructor(opts) {
    super(opts);
    this.name = 'LogtailTransport';
  }
  log(info, callback) {
    const data = JSON.stringify({
      dt: new Date().toISOString(),
      level: info.level,
      message: info.message,
      ...info,
    });

    const options = {
      hostname: process.env.LOGTAIL_HOST || '',
      port: 443,
      path: '/',
      method: process.env.LOGTAIL_METHOD || '',
      headers: {
        'Content-Type': process.env.LOGTAIL_CONTENT_TYPE || '',
        Authorization: process.env.LOGTAIL_TOKEN || '',
      },
    };

    const req = https.request(options, (res) => {
      res.on('data', () => {});
      res.on('end', () => callback());
    });

    req.on('error', (error) => {
      // Use process.stderr for logging transport errors
      process.stderr.write(`Logtail error: ${error.message}\n`);
      callback();
    });

    req.write(data);
    req.end();
  }
}

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(winston.format.timestamp(), winston.format.json()),
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(winston.format.colorize(), winston.format.simple()),
    }),
    new LogtailTransport({
      level: 'info',
    }),
  ],
});

module.exports = { logger };
