const path = require('path');
const nunjucks = require('nunjucks');
const log = require('./logger').getLogger('renderer');

const renderVms = async (template, vms) => {
  const dir = path.dirname(template);
  const file = path.basename(template);
  log.start(`Compiling ${file} from ${dir}`);

  nunjucks.configure(dir, {
    trimBlocks: true,
    lstripBlocks: true,
    noCache: true
  });
  try {
    const result = await nunjucks.render(file, { vms });
    log.complete(`Successful compilation`);

    return result;
  } catch (error) {
    log.error(error.message);
    throw error;
  }
};

module.exports = {
  renderVms
};
