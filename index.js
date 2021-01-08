const osu = require("node-os-utils");
const cpu = osu.cpu;
const drive = osu.drive;
const mem = osu.mem;
const cpu_usage = {
  run: () => cpu.usage(),
  isAsync: true,
};

const drive_usage = {
  run: async () => {
    const di = await drive.info();
    return parseFloat(di.usedPercentage);
  },
  isAsync: true,
};
const mem_usage = {
  run: async () => {
    const mi = await mem.info();
    return 100 - mi.freeMemPercentage;
  },
  isAsync: true,
};

module.exports = {
  sc_plugin_api_version: 1,
  functions: { cpu_usage, drive_usage, mem_usage },
};
