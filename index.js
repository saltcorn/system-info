const si = require("systeminformation");
const { json_list_to_external_table } = require("@saltcorn/data/plugin-helper");

const cpu_usage = {
  run: async () => {
    return (await si.currentLoad()).currentLoad;
  },
  isAsync: true,
  description: "System CPU load",
  arguments: [],
};

const processes = json_list_to_external_table(async () => {
  return (await si.processes()).list;
}, [
  { name: "pid", type: "Integer" },
  { name: "name", type: "String" },
  { name: "cpu", type: "Float" },
  { name: "mem", type: "Float" },
  { name: "user", type: "String" },
]);

const drive_usage = {
  run: async () => {
    const disks = await si.fsSize();
    let size = 0;
    let used = 0;
    disks.forEach((d) => {
      if (d && d.used && d.size) {
        size += d.size;
        used += d.used;
      }
    });
    return 100 * (used / size);
  },
  isAsync: true,
  arguments: [],
  description: "System disk occupancy, (%)",
};
const mem_usage = {
  run: async () => {
    const simem = await si.mem();
    return 100 - 100 * (simem.available / simem.total);
  },
  description: "System memory occupancy, (%)",
  isAsync: true,
  arguments: [],
};

module.exports = {
  sc_plugin_api_version: 1,
  functions: { cpu_usage, drive_usage, mem_usage },
  external_tables: { processes },
};
