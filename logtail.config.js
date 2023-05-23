require('dotenv').config();
const { Logtail } = require("@logtail/node");

const logtail = new Logtail(process.env.LOGTAIL_SOURCE_TOKEN);

function createLogger() {
  return {
    info: (message) => logtail.info(message),
    warn: (message) => logtail.warn(message),
    error: (message) => logtail.error(message),
  };
}

module.exports = {
  createLogger,
};