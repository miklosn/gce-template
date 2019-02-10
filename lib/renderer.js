const nunjucks = require('nunjucks');
const log = require('./logger').getLogger('renderer');

nunjucks.configure({
  trimBlocks: true,
  lstripBlocks: true,
  noCache: true
});
const renderVms = async (template, vms) => {
  try {
    const result = await nunjucks.render(template, { vms });
    return result;
  } catch (error) {
    throw error;
  }
};

module.exports = {
  renderVms
};
