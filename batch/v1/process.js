export const MAX_FRAGMENTATION = 200;

/** @param {NS} ns */
export function countRunningThreads(ns, scriptName, hostname, target) {
	let count = 0;
	for (let i = 0; i < MAX_FRAGMENTATION; i++) {
		count += ns.getRunningScript(scriptName, hostname, target, i)?.threads ?? 0;
	}
	return count;
}

/** @param {NS} ns */
export function countFragmentation(ns, scriptName, hostname, target) {
	let count = 0;
	for (let i = 0; i < MAX_FRAGMENTATION; i++) {
		if (ns.getRunningScript(scriptName, hostname, target, i) !== null) {
			count++;
		}
	}
	return count;
}

/** @param {NS} ns */
export function getAvailableNonce(ns, scriptName, hostname, target) {
	for (let i = 0; i < MAX_FRAGMENTATION; i++) {
		if (ns.getRunningScript(scriptName, hostname, target, i) === null) {
			return i;
		}
	}
	return NaN;
}

/** @param {NS} ns */
export function killRunningScripts(ns, scriptName, hostname, target) {
	for (let i = 0; i < MAX_FRAGMENTATION; i++) {
		const script = ns.getRunningScript(scriptName, hostname, target, i);
		if (script !== null) {
			ns.kill(scriptName, hostname, target, i);
		}
	}
}
