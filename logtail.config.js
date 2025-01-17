// logtail.config.js
const { createLogger, format } = require('winston');
const { Logtail } = require('@logtail/node');
const { LogtailTransport } = require('@logtail/winston');

/**
 * Create a Winston logger that sends logs directly to Logtail.
 * 
 * - Captures all levels (down to 'silly').
 * - Includes timestamp, stack traces (for Errors), and metadata in JSON format.
 * - Embeds ANSI codes in the message itself (for coloring) if you add them in your log calls.
 */
function createLoggerInstance() {
  // 1) Instantiate a Logtail client with your source token
  const logtail = new Logtail("YOUR_SOURCE_TOKEN");

  // 2) Define a Winston logger with the Logtail transport only
  const logger = createLogger({
    level: 'silly', // capture all levels: error, warn, info, http, verbose, debug, silly
    format: format.combine(
      format.timestamp(),
      format.errors({ stack: true }),
      format.metadata({
        fillExcept: ['message', 'level', 'timestamp', 'label', 'stack']
      }),
      format.json()
    ),
    transports: [
      new LogtailTransport(logtail)
    ],
  });

  return logger;
}

module.exports = { createLogger: createLoggerInstance };