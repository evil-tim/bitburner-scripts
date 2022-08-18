import * as consts from "/batch/v2/consts.js"
import * as process from "/batch/v2/process.js"

/** @param {NS} ns */
export async function main(ns) {
	const threshold = Math.floor(consts.TIME_GAP_MS * 0.4);
	const target = ns.args[0];
	const delay = Number(ns.args[1]);
	const threadNo = ns.args[2];
	const nonce = Number(ns.args[3]);
	const expectedTime = Number(ns.args[4]);

	await ns.sleep(delay);

	const actualTime = Math.ceil(ns.getHackTime(target));
	const diff = expectedTime - actualTime;
	if (Math.abs(diff) >= threshold) {
		const message = "hack time mismatch " + expectedTime + " vs " + actualTime + " (" + diff + "ms)"
		await process.killThreadGroup(ns, ns.getHostname(), target, nonce, threadNo, message);
		return;
	}
	await ns.hack(target);
}
