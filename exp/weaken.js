/** @param {NS} ns */
export async function main(ns) {
	let hostname = ns.args[0];
	while (true) {
		await ns.weaken(hostname);
	}
}
