const si = require("systeminformation");
const { json_list_to_external_table } = require("@saltcorn/data/plugin-helper");

const child_process = require("child_process");

function spawn(command, args, spawnOpts = {}) {
  return new Promise((resolve, reject) => {
    let errorData = "";

    const spawnedProcess = child_process.spawn(command, args, spawnOpts);

    let data = "";

    spawnedProcess.on("message", console.log);

    spawnedProcess.stdout.on("data", chunk => {

      data += chunk.toString();
    });

    spawnedProcess.stderr.on("data", chunk => {
      errorData += chunk.toString();
    });

    spawnedProcess.on("close", function (code) {
      if (code > 0) {
        return reject(new Error(`${errorData} (Failed Instruction: ${command} ${args.join(" ")})`));
      }

      resolve(data);
    });

    spawnedProcess.on("error", function (err) {
      reject(err);
    });
  });
}

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
  { name: "pid", type: "Integer", primary_key: true },
  { name: "name", type: "String" },
  { name: "cpu", type: "Float" },
  { name: "mem", type: "Float" },
  { name: "user", type: "String" },
]);

const journald_log = json_list_to_external_table(
  async ({ where }) => {
    console.log("journal where", where);
    let setSince = false
    let qs = ["-o", "json"];
    if (where?.unit?.ilike) {
      qs.push("-u"); qs.push(where.unit.ilike);
    } else if (where?.unit) {
      qs.push("-u"); qs.push(where.unit);
    };
    if (where?.hours_ago?.lt) {
      qs.push("--since")
      qs.push(`${where.hours_ago.lt} hours ago`)
      setSince = true
    }
    if (Array.isArray(where?.hours_ago)) {
      for (const wh of where?.hours_ago) {
        if (wh.lt) {
          qs.push("--since")
          qs.push(`${wh.lt} hours ago`)
          setSince = true
        }
      }
    }
    if (!setSince) {
      qs.push("--since")
      qs.push(`1 hour ago`)
    }
    console.log({ qs });
    const sout = await spawn(`journalctl`, qs);
    const now = new Date();
    const rows = sout.split("\n").map((s) => {
      let o
      try {
        o = JSON.parse(s);
      }
      catch (e) { return null }
      const time = new Date(+o.__REALTIME_TIMESTAMP / 1000);
      return {
        realtime_timestamp: o.__REALTIME_TIMESTAMP,
        unit: o.SYSLOG_IDENTIFIER,
        message: o.MESSAGE,
        time,
        hours_ago: Math.abs(now - time) / 36e5,
      };
    }).filter(o => o);
    console.log({ rows });
    return rows
  },
  [
    { name: "realtime_timestamp", type: "String", primary_key: true },
    { name: "unit", type: "String" },
    { name: "message", type: "String" },
    { name: "time", type: "Date" },
    { name: "hours_ago", type: "Float" },
  ]
);

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
  external_tables: { processes, journald_log },
};
