/** @param {NS} ns */
export function getAllOwnedServers(ns) {
	return getAllServers(
		ns,
		server => ns.getServer(server).purchasedByPlayer
	);
}

/** @param {NS} ns */
export function getAllExternServers(ns) {
	return getAllServers(
		ns,
		server => !ns.getServer(server).purchasedByPlayer
	);
}

/**
 * @param {NS} ns
 * @param {function} includes
 */
function getAllServers(ns, includes) {
	const unscannedServers = [
		new ServerInfo(
			"home",
			["home"]
		)
	];
	const scannedServers = [];

	while (unscannedServers.length > 0) {
		const server = unscannedServers.pop();
		const serverName = server.name;
		const foundServers = ns.scan(serverName)
			.filter(foundServerName => !serverExistsInList(scannedServers, foundServerName))
			.filter(includes)
			.map(foundServerName => new ServerInfo(
				foundServerName,
				[...server.path, foundServerName]
			));
		unscannedServers.push(...foundServers);
		if (includes(serverName)) {
			scannedServers.push(server);
		}
	}

	return scannedServers.map(scannedServer => new ExtendedServerInfo(ns, scannedServer));
}

function serverExistsInList(serverList, serverName) {
	return serverList.map(server => server.name).includes(serverName);
}

class ServerInfo {
	name;
	path;

	constructor(name, path) {
		this.name = name;
		this.path = path;
	}
}

class ExtendedServerInfo extends ServerInfo {
	root;
	backdoor;
	sec;
	minSec;
	money;
	maxMoney;
	growth;
	mem;
	usedMem;
	level;
	ownServer;

	/**
	 * @param {NS} ns
	 * @param {ServerInfo} serverInfo
	 */
	constructor(ns, serverInfo) {
		super(serverInfo.name, serverInfo.path)

		const server = ns.getServer(this.name);
		this.root = ns.hasRootAccess(this.name);
		this.backdoor = server.backdoorInstalled;
		this.sec = ns.getServerSecurityLevel(this.name);
		this.minSec = ns.getServerMinSecurityLevel(this.name);
		this.money = ns.getServerMoneyAvailable(this.name);
		this.maxMoney = ns.getServerMaxMoney(this.name);
		this.growth = ns.getServerGrowth(this.name);
		this.mem = ns.getServerMaxRam(this.name);
		this.usedMem = ns.getServerUsedRam(this.name);
		this.level = ns.getServerRequiredHackingLevel(this.name);
		this.ownServer = server.purchasedByPlayer;
	}
}
