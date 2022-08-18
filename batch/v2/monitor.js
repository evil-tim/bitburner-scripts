import * as consts from "/batch/v2/consts.js"

/** @param {NS} ns */
export async function main(ns) {
	ns.disableLog("disableLog");
	ns.disableLog("sleep");
	ns.tail();
	while (true) {
		while (ns.peek(consts.LOG_PORT) !== "NULL PORT DATA") {
			ns.print(ns.readPort(consts.LOG_PORT));
		}
		await ns.sleep(1000);
	}
}
