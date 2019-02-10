const { Signale } = require('signale');

const options = {
  stream: process.stderr
};

const logger = new Signale(options);
logger.config({
  displayFilename: false,
  displayTimestamp: true,
  displayDate: true
});

const getLogger = scope => {
  return logger.scope(scope);
};

module.exports = {
  getLogger
};
