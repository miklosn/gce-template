'use strict';

const program = require('commander');
const gcewrapper = require('./lib/gcewrapper');
const log = require('./lib/logger').getLogger('main');
const outputtable = require('./lib/outputtable');
const renderer = require('./lib/renderer');

program
  .version('0.1.0')
  .arguments('[template]')
  .option('-v, --verbose', 'verbose logging');

program.on('--help', () => {
  console.log('');
  console.log('[template file]     if omitted, will output a default table');
});

program.parse(process.argv);

if (program.args.length > 1) {
  program.help();
}

exports.main = async () => {
  try {
    const vms = await await gcewrapper.getVMs();

    if (program.args[0]) {
      console.log(await renderer.renderVms(program.args[0], vms));
    } else {
      outputtable.printVms(vms);
    }
  } catch (error) {
    log.error(error.message);
    process.exit(1);
  }
};

if (module === require.main) {
  exports.main();
}
