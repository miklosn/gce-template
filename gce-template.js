'use strict';

const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');
const program = require('commander');
const getStdin = require('get-stdin');
const tempy = require('tempy');

const gce = require('./lib/gce');
const logger = require('./lib/logger');
const log = logger.getLogger('main');
const renderer = require('./lib/renderer');

program
  .version('0.1.0')
  .arguments('[template]')
  .option(
    '-w, --watch <seconds>',
    'watch mode. wait <seconds> between querying the API',
    parseInt
  )
  .option('-o, --output <file>', 'output file')
  .option('--onchange <command>', 'execute shell command on change')
  .option('-v, --verbose', 'verbose logging');

program.on('--help', () => {
  console.log('');
  console.log('[template file]     if omitted, will output a default table');
});

program.parse(process.argv);

if (program.verbose) {
  logger.setVerbose(true);
}

let previousResults = '';

const handleChanges = async (previous, current) => {
  const prevfile = tempy.file();
  if (program.onchange) {
    log.debug(`Writing previous state to ${prevfile}`);
    fs.writeFileSync(prevfile, previous);
    const curfile = tempy.file();
    fs.writeFileSync(curfile, current);
    log.debug(`Writing current state to ${curfile}`);
  }
  if (program.output) {
    const tmpfile = tempy.file();
    log.debug(`Writing buffer to ${tmpfile}`);
    fs.writeFileSync(tmpfile, current);
    log.debug(`Renaming ${tmpfile} to ${program.output}`);
    fs.renameSync(tmpfile, program.output);
  } else {
    await process.stdout.write(current);
  }
  if (program.onchange) {
    log.debug('Forking onchange handler');
    const child = spawn(program.onchange, { shell: true });
    child.stdout.on('data', data => {
      log.debug(data.toString());
    });
    child.stderr.on('data', data => {
      log.debug(data.toString());
    });
    child.on('close', code => {
      if (code > 0) {
        log.error(`onchange process exited with code ${code}`);
      } else {
        log.debug(`onchange handler finished`);
      }
      log.debug(`Unlinking ${prevfile}`);
      fs.unlinkSync(prevfile);
      log.debug(`Unlinking ${curfile}`);
      fs.unlinkSync(curfile);
    });
  }
};

const loop = async () => {
  let [vms, disks] = [{}, {}];
  try {
    [vms, disks] = await Promise.all([gce.getVMs(), gce.getDisks()]);
    const results = await renderer.render(vms, disks);
    if (results == previousResults) {
      log.info('no changes');
    } else {
      log.info('we have changes');
      await handleChanges(previousResults, results);
      previousResults = results;
    }
  } catch (error) {
    log.error(error.message);
    if (!program.watch) {
      process.exit(1);
    } else {
      log.info('In watch mode, retrying');
    }
  }

  if (program.watch) {
    if (typeof program.watch != 'boolean') {
      const wait = program.watch * 1000;
      log.debug(`Next query in ${program.watch} seconds`);
      setTimeout(loop, wait);
    } else {
      const wait = 100 * 1000;
      log.debug(`Next query in 100 seconds`);
      setTimeout(loop, 100000);
    }
  }
};

exports.main = async () => {
  try {
    if (program.args && program.args[0]) {
      const dir = path.dirname(program.args[0]);
      log.debug(
        `Reading ${program.args[0]} as template, using base dir: ${dir}`
      );
      const contents = fs.readFileSync(program.args[0]).toString();
      await renderer.setTemplate(contents, dir);
    } else {
      log.debug('Using stdin for template');
      const contents = await getStdin();
      await renderer.setTemplate(contents, '.');
    }
  } catch (error) {
    log.error(error.message);
    process.exit(1);
  }
  await loop();
};

if (module === require.main) {
  exports.main();
}
