const Table = require('cli-table');

const printVms = vms => {
  const table = new Table({
    head: ['Name', 'Zone', 'IP'],
    colWidths: [60, 25, 15],
    chars: { 'mid': '', 'left-mid': '', 'mid-mid': '', 'right-mid': '' }
  });
  vms.forEach(vm => {
    table.push([vm.name, vm.zone, vm.networkInterfaces[0].networkIP]);
  });
  console.log(table.toString());
};

module.exports = {
  printVms
};
