import * as extrastats from '/util/extrastats.js'

/** @param {NS} ns */
export async function main(ns) {
	ns.atExit(extrastats.cleanupRows);

	const { color0, color1, color2 } = extrastats.getColors();
	const stats = [
		{
			name: "Karma",
			color: color0,
			generator: async () => ns.nFormat(await ns.heart.break(), "0.000a")
		},
		{
			name: "Kills",
			color: color0,
			generator: () => ns.nFormat(ns.getPlayer().numPeopleKilled, "0a")
		},
		{
			name: "Scr",
			color: color1,
			generator: () => "$" + ns.nFormat(ns.getTotalScriptIncome()[1], "0.000a") + "/sec"
		},
		{
			name: "HN",
			color: hasHNServers(ns) ? color2 : color1,
			generator: hasHNServers(ns) ?
				() => ns.nFormat(getTotalHNProduction(ns), "0.000a") + "H/sec" :
				() => "$" + ns.nFormat(getTotalHNProduction(ns), "0.000a") + "/sec"
		},
		{
			name: "Hash",
			color: color2,
			generator: () => ns.nFormat(ns.hacknet.numHashes(), "0.000a"),
			pctGenerator: () => ns.hacknet.hashCapacity() > 0 ? ns.hacknet.numHashes() / ns.hacknet.hashCapacity() : 0,
		},
	];

	extrastats.setupRows(stats);
	while (true) {
		await extrastats.updateRows(stats);
		await ns.sleep(1000);
	}
}

/** @param {NS} ns */
function hasHNServers(ns) {
	return ns.getPlayer().bitNodeN === 9 ||
		ns.singularity
			.getOwnedSourceFiles()
			.filter(sf => sf.n === 9)
			.filter(sf => sf.lvl > 0)
			.length > 0;
}

/** @param {NS} ns */
function getTotalHNProduction(ns) {
	let nodeCount = ns.hacknet.numNodes();
	let totalProduction = 0;
	for (let i = 0; i < nodeCount; i++) {
		const nodeStats = ns.hacknet.getNodeStats(i);
		totalProduction += nodeStats.production;
	}
	return totalProduction;
}
