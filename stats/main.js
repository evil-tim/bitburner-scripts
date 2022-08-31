import * as extrastats from '/util/extrastats.js'

/** @param {NS} ns */
export async function main(ns) {
	ns.atExit(extrastats.clearExtraHooks);

	const { color0, color1, color2 } = extrastats.getColors();
	const stats = [
		{
			name: "Scr",
			color: color1,
			generator: () => "$" + ns.nFormat(ns.getTotalScriptIncome()[1], "0.000a") + "/sec"
		},
		{
			name: "HN",
			color: color1,
			generator: () => "$" + ns.nFormat(getTotalHNProduction(ns), "0.000a") + "/sec"
		},
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
	];

	while (true) {
		await extrastats.updateExtraHooks(stats);
		await ns.sleep(1000);
	}
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
