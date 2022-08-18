const BASE_URL = "https://raw.githubusercontent.com/evil-tim/bitburner-scripts/main";
const FILES = [
    "/augs/main.js",
    "/batch/config/config.js",
    "/batch/config/config.txt",
    "/batch/v1/consts.js",
    "/batch/v1/grow.js",
    "/batch/v1/hack.js",
    "/batch/v1/main.js",
    "/batch/v1/process.js",
    "/batch/v1/weaken.js",
    "/bootstrap.js",
    "/crime/s-main.js",
    "/exp/main.js",
    "/exp/weaken.js",
    "/hacknet/main.js",
    "/root/main.js",
    "/root/s-main.js",
    "/scan/main.js",
    "/scan/scan.js",
    "/server/main.js",
    "/solver/max_subarr.js",
    "/solver/path.js",
];

/** @param {NS} ns */
export async function main(ns) {
	for (const file of FILES) {
		await ns.wget(BASE_URL + file, file, "home");
	}
}
