/**
 * 0 - command - start | stop
 * 1 - server name
 * 2 - exclude servers
 */

import * as scan from "/scan/scan.js";

const WEAKEN_SCRIPT = "/exp/weaken.js"

/** @param {NS} ns */
export async function main(ns) {
	let cmd = ns.args[0];
	if (!cmd) {
		return;
	}
	if (cmd === "start") {
		await start(ns);
	} else if (cmd === "stop") {
		stop(ns);
	}
}

/** @param {NS} ns */
async function start(ns) {
	const target = !!ns.args[1] ? ns.args[1] : "joesguns";

	const hostnamesExcludeArg = ns.args[2];
	const hostnamesExclude = hostnamesExcludeArg ?
		hostnamesExcludeArg.split(",")
			.map(hostname => hostname.trim())
			.filter(hostname => hostname !== "")
			.filter(hostname => ns.serverExists(hostname))
			.filter(hostname => ns.hasRootAccess(hostname)) :
		[];

	const weakenRamPerThread = ns.getScriptRam(WEAKEN_SCRIPT);
	const allServers = getAllServers(ns)
		.filter(server => !hostnamesExclude.includes(server));

	for (const server of allServers) {
		if (!ns.fileExists(WEAKEN_SCRIPT, server)) {
			await ns.scp(WEAKEN_SCRIPT, server);
		}
		const freeRam = ns.getServerMaxRam(server) - ns.getServerUsedRam(server);
		const threads = Math.floor(freeRam / weakenRamPerThread);
		if (threads > 0) {
			ns.exec(WEAKEN_SCRIPT, server, threads, target);
		}
	}
}

/** @param {NS} ns */
async function stop(ns) {
	const allServers = getAllServers(ns);

	for (const server of allServers) {
		ns.ps(server)
			.filter(script => script.filename === WEAKEN_SCRIPT)
			.forEach(script => ns.kill(script.pid, server, ...script.args));
	}
}

/** @param {NS} ns */
function getAllServers(ns) {
	return [
		...scan
			.getAllExternServers(ns)
			.filter(server => ns.hasRootAccess(server.name))
			.map(server => server.name),
		...scan
			.getAllOwnedServers(ns)
			.map(server => server.name)
	];
}
