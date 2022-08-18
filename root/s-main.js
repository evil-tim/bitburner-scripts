import * as scan from "/scan/scan.js";

const BACKDOOR = [
	"CSEC",
	"avmnite-02h",
	"I.I.I.I",
	".",
	"run4theh111z",
	"The-Cave",
	"w0r1d_d43m0n"
];

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
		for (const server of servers) {
			await processServer(ns, server);
		}
		await ns.sleep(30000);
	}
}

/** @param {NS} ns */
async function processServer(ns, server) {
	if (!ns.hasRootAccess(server.name)) {
		rootServer(ns, server.name);
	}
	if (ns.hasRootAccess(server.name)) {
		await backDoorServer(ns, server);
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

/** @param {NS} ns */
async function backDoorServer(ns, server) {
	if (BACKDOOR.includes(server.name) && !server.backdoor) {
		for (const step of server.path) {
			ns.singularity.connect(step);
		}
		await ns.singularity.installBackdoor();
		ns.singularity.connect("home");
	}
}
