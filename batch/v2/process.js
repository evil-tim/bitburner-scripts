import * as consts from "/batch/v2/consts.js"
import * as log from "/batch/v2/log.js"

const MAX_RUNNER_NONCE = 400;

/** @param {NS} ns */
export function getAvailableNonce(ns, hostname, target) {
	const processes = ns.ps(hostname);
	const allNonces = processes
		.filter(process =>
			process.filename === consts.H_SCRIPT ||
			process.filename === consts.G_SCRIPT ||
			process.filename === consts.W_SCRIPT)
		.filter(process => process.args[0] === target)
		.map(process => Number(process.args[3]))
		.filter((value, index, self) => self.indexOf(value) === index);
	for (let i = 0; i < MAX_RUNNER_NONCE; i++) {
		if (!allNonces.includes(i)) {
			return i;
		}
	}
	return NaN;
}

/** @param {NS} ns */
export function getThreadGroupPids(ns, hostname, target, nonce, excludeThreadNo) {
	return ns.ps(hostname)
		.filter(process =>
			process.filename === consts.H_SCRIPT ||
			process.filename === consts.G_SCRIPT ||
			process.filename === consts.W_SCRIPT)
		.filter(process => process.args[0] === target)
		.filter(process => process.args[2] !== excludeThreadNo)
		.filter(process => Number(process.args[3]) === Number(nonce))
		.map(process => process.pid);
}

/** @param {NS} ns */
export async function killThreadGroup(ns, hostname, target, nonce, excludeThreadNo, message) {
	getThreadGroupPids(ns, hostname, target, nonce, excludeThreadNo)
		.forEach(pid => ns.kill(pid));
	await log.info(ns, "Kill group " + nonce + " at " + ns.getHostname() + "==>" + target + " - " + message);
}
