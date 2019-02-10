'use strict';

const Compute = require('@google-cloud/compute');
const log = require('./logger').getLogger('gcewrapper');
const compute = new Compute();

const transformVm = vm => {
  const result = {
    id: vm.metadata.id,
    creationTimestamp: vm.metadata.creationTimestamp,
    name: vm.metadata.name,
    machineType: /[^/]+$/.exec(vm.metadata.machineType)[0],
    status: vm.metadata.status,
    zone: vm.zone.name,
    canIpForward: vm.metadata.canIpForward,
    networkInterfaces: vm.metadata.networkInterfaces,
    disks: vm.metadata.disks,
    selfLink: vm.metadata.selfLink,
    scheduling: vm.metadata.scheduling,
    cpuPlatform: vm.metadata.cpuPlatform,
    labels: vm.metadata.labels,
    startRestricted: vm.metadata.startRestricted,
    deletionProtection: vm.metadata.deletionProtection
  };
  return result;
};

const getVMs = async options => {
  try {
    const vms = await compute.getVMs(options);
    const parsed = vms[0].map(vm => transformVm(vm));
    return parsed;
  } catch (error) {
    throw error;
  }
};

const getAddresses = async options => {
  try {
    const vms = await compute.getAddresses(options);
    log.info(vms[0][0].metadata);
    return vms;
  } catch (error) {
    throw error;
  }
};

const getDisks = async options => {
  try {
    const vms = await compute.getDisks(options);
    log.info(vms[0][0].metadata);
    return vms;
  } catch (error) {
    throw error;
  }
};

module.exports = {
  getVMs,
  getAddresses,
  getDisks
};
