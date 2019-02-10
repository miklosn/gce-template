'use strict';

const Compute = require('@google-cloud/compute');
const log = require('./logger').getLogger('gce');
const compute = new Compute({ autoRetry: true });

const transformVm = vm => {
  const result = {
    id: vm.metadata.id,
    creationTimestamp: Date.parse(vm.metadata.creationTimestamp),
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

const transformDisk = disk => {
  const result = {
    id: disk.metadata.id,
    creationTimestamp: Date.parse(disk.metadata.lastAttachTimestamp),
    name: disk.metadata.name,
    description: disk.metadata.description,
    sizeGb: parseInt(disk.metadata.sizeGb),
    status: disk.metadata.status,
    sourceSnapshot: disk.metadata.sourceSnapshot,
    selfLink: disk.metadata.selfLink,
    type: /[^/]+$/.exec(disk.metadata.type)[0],
    users: disk.metadata.users,
    physicalBlockSizeBytes: parseInt(disk.metadata.physicalBlockSizeBytes)
  };

  if (disk.metadata.replicaZones) {
    result.replicaZones = disk.metadata.replicaZones.map(
      zone => /[^/]+$/.exec(zone)[0]
    );
  }

  if (disk.metadata.region) {
    result.region = /[^/]+$/.exec(disk.metadata.region)[0];
  }

  if (disk.metadata.lastAttachTimestamp) {
    result.lastAttachTimestamp = Date.parse(disk.metadata.lastAttachTimestamp);
  }

  if (disk.metadata.lastDetachTimestamp) {
    result.lastDetachTimestamp = Date.parse(disk.metadata.lastDetachTimestamp);
  }

  return result;
};

const getVMs = async options => {
  try {
    log.start('Fetching instances');
    let vms = {};
    const rows = await compute.getVMs(options);
    log.complete(`Fetched ${rows[0].length} instances`);
    rows[0]
      .map(vm => transformVm(vm))
      .sort((a, b) => a.name.localeCompare(b.name))
      .map(vm => {
        vms[vm.selfLink] = vm;
      });
    return vms;
  } catch (error) {
    log.error(error.message);
    throw error;
  }
};

const getAddresses = async options => {
  try {
    const vms = await compute.getAddresses(options);
    log.info(vms[0][0].metadata);
    return vms;
  } catch (error) {
    log.error(error.message);
    throw error;
  }
};

const getDisks = async options => {
  try {
    log.start('Fetching disks');
    let disks = {};
    const rows = await compute.getDisks(options);
    log.complete(`Fetched ${rows[0].length} disks`);
    rows[0]
      .map(disk => transformDisk(disk))
      .sort((a, b) => a.name.localeCompare(b.name))
      .map(disk => {
        disks[disk.selfLink] = disk;
      });
    return disks;
  } catch (error) {
    log.error(error.message);
    throw error;
  }
};

module.exports = {
  getVMs,
  getAddresses,
  getDisks
};
