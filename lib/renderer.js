const path = require('path');
const nunjucks = require('nunjucks');
const dateFilter = require('nunjucks-date-filter');
const log = require('./logger').getLogger('render');

const options = {
  trimBlocks: true,
  lstripBlocks: true,
  autoescape: false
};

let template = {};

const setTemplate = async (src, path) => {
  try {
    log.start('Initializing renderer');
    const env = new nunjucks.Environment(
      new nunjucks.FileSystemLoader(path),
      options
    );
    env.addFilter('date', dateFilter);
    log.start('Compiling template');
    template = new nunjucks.Template(src, env, path, true);
  } catch (error) {
    log.error(error.message);
  }
};

const render = async (vms, disks, images) => {
  try {
    const result = await template.render({ env: process.env, vms, disks, images });
 //   console.log(result);
    log.complete(`Successful compilation`);
    return result;
  } catch (error) {
    log.error(error.message);
    throw error;
  }
};

module.exports = {
  setTemplate,
  render
};
