const { Signale } = require('signale');

let verbose = false;

const setVerbose = v => {
  verbose = v;
};

const options = {
  stream: process.stderr
};

const logger = new Signale(options);

logger.config({
  displayFilename: false,
  displayTimestamp: false,
  displayDate: false
});

const getLogger = scope => {
  return {
    signale: logger.scope(scope),
    info: function(params) {
      if (verbose) {
        this.signale.info(params);
      }
    },
    error: function(params) {
      this.signale.error(params);
    },
    start: function(params) {
      if (verbose) {
        this.signale.start(params);
      }
    },
    complete: function(params) {
      if (verbose) {
        this.signale.complete(params);
      }
    },
    debug: function(params) {
      if (verbose) {
        this.signale.debug(params);
      }
    }
  };
};

module.exports = {
  setVerbose,
  getLogger
};
