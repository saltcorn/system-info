const osu = require("node-os-utils");
const cpu = osu.cpu;
const drive = osu.drive;
const mem = osu.mem;

const cpu_usage = {
  run: () => cpu.usage(),
  isAsync: true,
  description: "System CPU load",
  arguments: [],
};

const drive_usage = {
  run: async () => {
    const di = await drive.info();
    return parseFloat(di.usedPercentage);
  },
  isAsync: true,
  arguments: [],
  description: "System disk occupancy, (%)",
};
const mem_usage = {
  run: async () => {
    const mi = await mem.info();
    return 100 - mi.freeMemPercentage;
  },
  description: "System memory occupancy, (%)",
  isAsync: true,
  arguments: [],
};

module.exports = {
  sc_plugin_api_version: 1,
  functions: { cpu_usage, drive_usage, mem_usage },
};
