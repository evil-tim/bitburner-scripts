const BASE_URL = "https://raw.githubusercontent.com/evil-tim/bitburner-scripts/main";
const FILES = [
    "/augs/main.js",
    "/batch/config/config.js",
    "/batch/config/config.txt",
    "/batch/monitor/main.js",
    "/batch/v1/consts.js",
    "/batch/v1/grow.js",
    "/batch/v1/hack.js",
    "/batch/v1/main.js",
    "/batch/v1/process.js",
    "/batch/v1/weaken.js",
    "/batch/v2/consts.js",
    "/batch/v2/grow.js",
    "/batch/v2/hack.js",
    "/batch/v2/log.js",
    "/batch/v2/main.js",
    "/batch/v2/monitor.js",
    "/batch/v2/process.js",
    "/batch/v2/weaken.js",
    "/bootstrap.js",
    "/crime/s-main.js",
    "/exp/main.js",
    "/exp/weaken.js",
    "/faction/s-main.js",
    "/hacknet/f-main.js",
    "/hacknet/main.js",
    "/rep/main.js",
    "/rep/s-main.js",
    "/rep/share.js",
    "/root/main.js",
    "/root/s-main.js",
    "/scan/main.js",
    "/scan/scan.js",
    "/server/main.js",
    "/solver/max_subarr.js",
    "/solver/path.js",
    "/util/terminal.js",
];

/** @param {NS} ns */
export async function main(ns) {
	for (const file of FILES) {
		await ns.wget(BASE_URL + file, file, "home");
	}
}
