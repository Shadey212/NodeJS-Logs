// logtail.config.js
const { createLogger, format } = require('winston');
const { Logtail } = require('@logtail/node');
const { LogtailTransport } = require('@logtail/winston');

function createLoggerInstance() {
  const logtail = new Logtail(process.env.LOGTAIL_SOURCE_TOKEN);

  // 1) Create a custom format that renames `timestamp` to `dt`.
  const renameTimestampToDt = format((info) => {
    // Winston’s built-in timestamp format adds `info.timestamp`.
    if (info.timestamp) {
      info.dt = info.timestamp;   // rename field
      delete info.timestamp;      // remove the old timestamp
    }
    return info;
  });

  // 2) Combine the usual Winston formats, plus our rename step
  const logger = createLogger({
    level: 'silly',
    format: format.combine(
      // This adds `info.timestamp` to each log
      format.timestamp(),
      // Rename `timestamp` to `dt`
      renameTimestampToDt(),
      // Include error stacks
      format.errors({ stack: true }),
      // Put extra keys (userId, sessionId, etc.) in `metadata`
      format.metadata({
        fillExcept: ['message', 'level', 'dt', 'label', 'stack']
      }),
      // Output final logs as JSON
      format.json()
    ),
    transports: [
      new LogtailTransport(logtail),
    ],
  });

  return logger;
}

module.exports = { createLogger: createLoggerInstance };