const winston = require('winston');
const { Logtail } = require('@logtail/node');
const { LogtailTransport } = require('@logtail/winston');

function createLoggerInstance() {
  const oldEndpoint = process.env.LOGTAIL_OLD_ENDPOINT
  const newEndpoint = process.env.LOGTAIL_NEW_ENDPOINT

  const logtailOld = new Logtail(process.env.LOGTAIL_SOURCE_TOKEN, {
    endpoint: oldEndpoint
  });

  const logtailNew = new Logtail(process.env.OTHER_LOGTAIL_SOURCE_TOKEN, {
    endpoint: newEndpoint
  });

  const renameTimestampToDt = winston.format((info) => {
    if (info.timestamp) {
      info.dt = info.timestamp;
      delete info.timestamp;
    }
    return info;
  });

  const logger = winston.createLogger({
    level: 'silly',
    format: winston.format.combine(
      winston.format.timestamp(),
      renameTimestampToDt(),
      winston.format.errors({ stack: true }),
      winston.format.metadata({ fillExcept: ['message', 'level', 'dt', 'label', 'stack'] }),
      winston.format.json()
    ),
    transports: [
      new LogtailTransport(logtailOld),
      new LogtailTransport(logtailNew)
    ],
  });

  return logger;
}

module.exports = { createLogger: createLoggerInstance };