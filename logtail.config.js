require('dotenv').config();
const { Logtail } = require("@logtail/node");

const logtail = new Logtail(process.env.LOGTAIL_SOURCE_TOKEN);

function createLogger() {
  return {
    error: (message) => logtail.error(message),
    warn: (message) => logtail.warn(message),
    info: (message) => logtail.info(message),
    debug: (message) => logtail.debug(message),
    fatal: (message) => logtail.error({...message, level: 'fatal'}), // use .error method, but add 'level' field to indicate fatal error
    // Similarly, you can add other log levels using the existing methods and the 'level' field
    http: (message) => logtail.info({...message, level: 'http'}), // use .info method for http level
    verbose: (message) => logtail.debug({...message, level: 'verbose'}), // use .debug method for verbose level
    silly: (message) => logtail.debug({...message, level: 'silly'}), // use .debug method for silly level
    trace: (message) => logtail.debug({...message, level: 'trace'}), // use .debug method for trace level
  };
}

module.exports = {
  createLogger,
};
