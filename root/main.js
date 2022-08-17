import * as scan from "/scan/scan.js";

/** @param {NS} ns */
export async function main(ns) {
	ns.disableLog("disableLog");
	ns.disableLog("sleep");
	ns.disableLog("scan");
	ns.disableLog("hasRootAccess");
	ns.disableLog("getServerSecurityLevel");
	ns.disableLog("getServerMinSecurityLevel");
	ns.disableLog("getServerMoneyAvailable");
	ns.disableLog("getServerMaxMoney");
	ns.disableLog("getServerGrowth");
	ns.disableLog("getServerMaxRam");
	ns.disableLog("getServerUsedRam");
	ns.disableLog("getServerRequiredHackingLevel");
	ns.disableLog("getHackingLevel");
	ns.disableLog("getServerNumPortsRequired");

	while (true) {
		const servers = scan.getAllExternServers(ns);
		for (let i in servers) {
			const server = servers[i];
			processServer(ns, server.name);
		}
		await ns.sleep(30000);
	}
}
/** @param {NS} ns */
function processServer(ns, server) {
	if (!ns.hasRootAccess(server)) {
		rootServer(ns, server);
	}
}
/** @param {NS} ns */
function rootServer(ns, server) {
	let currHackLevel = ns.getHackingLevel();
	let hackLevel = ns.getServerRequiredHackingLevel(server);
	let numPorts = ns.getServerNumPortsRequired(server);
	let bruteSshExists = ns.fileExists("BruteSSH.exe", "home");
	let ftpCrackExists = ns.fileExists("FTPCrack.exe", "home");
	let relaySmtpExists = ns.fileExists("relaySMTP.exe", "home");
	let httpWormExists = ns.fileExists("HTTPWorm.exe", "home");
	let sqlInjectExists = ns.fileExists("SQLInject.exe", "home");

	let openablePorts =
		(bruteSshExists ? 1 : 0) +
		(ftpCrackExists ? 1 : 0) +
		(relaySmtpExists ? 1 : 0) +
		(httpWormExists ? 1 : 0) +
		(sqlInjectExists ? 1 : 0);

	if (currHackLevel >= hackLevel && openablePorts >= numPorts) {
		if (bruteSshExists) {
			ns.brutessh(server);
		}
		if (ftpCrackExists) {
			ns.ftpcrack(server);
		}
		if (relaySmtpExists) {
			ns.relaysmtp(server);
		}
		if (httpWormExists) {
			ns.httpworm(server);
		}
		if (sqlInjectExists) {
			ns.sqlinject(server);
		}
		ns.nuke(server);
		ns.print("Rooted " + server);
	}
}
