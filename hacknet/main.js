/**
 * 0 - min money to keep | "adaptive"
 */

const MAX_NODES = 15;
const MAX_LEVEL = 200;
const MAX_RAM = 64;
const MAX_CORES = 16;

const MIN_MONEY = 100_000_000;

/** @param {NS} ns */
export async function main(ns) {
	ns.disableLog("getServerMoneyAvailable");

	while (true) {
		const hn = ns.hacknet;
		let nodeCount = hn.numNodes();

		let totalProduction = 0;
		for (let i = 0; i < nodeCount; i++) {
			const nodeStats = hn.getNodeStats(i);
			totalProduction += nodeStats.production;
		}
		ns.print("Total production : " + totalProduction);


		let moneyLimit = MIN_MONEY;
		if (ns.args[0] && ns.args[0] === "adaptive") {
			moneyLimit = totalProduction * 60 * 120;
		} else if (ns.args[0] && !isNaN(Number(ns.args[0]))) {
			moneyLimit = Number(ns.args[0]);
		}
		ns.print("Limit to : " + moneyLimit);


		if (nodeCount < MAX_NODES && canPurchase(ns, hn.getPurchaseNodeCost(), moneyLimit)) {
			ns.print("Buy Node for " + hn.getPurchaseNodeCost());
			hn.purchaseNode();
		}
		nodeCount = hn.numNodes();
		for (let i = 0; i < nodeCount; i++) {
			const nodeStats = hn.getNodeStats(i);
			if (nodeStats.level < MAX_LEVEL && canPurchase(ns, hn.getLevelUpgradeCost(i, 1), moneyLimit)) {
				ns.print("Upgrade Node " + i + " level for " + hn.getLevelUpgradeCost(i, 1));
				hn.upgradeLevel(i, 1)
			}
		}
		for (let i = 0; i < nodeCount; i++) {
			const nodeStats = hn.getNodeStats(i);
			if (nodeStats.ram < MAX_RAM && canPurchase(ns, hn.getRamUpgradeCost(i, 1), moneyLimit)) {
				ns.print("Upgrade Node " + i + " RAM for " + hn.getRamUpgradeCost(i, 1));
				hn.upgradeRam(i, 1)
			}
		}
		for (let i = 0; i < nodeCount; i++) {
			const nodeStats = hn.getNodeStats(i);
			if (nodeStats.cores < MAX_CORES && canPurchase(ns, hn.getCoreUpgradeCost(i, 1), moneyLimit)) {
				ns.print("Upgrade Node " + i + " core for " + hn.getCoreUpgradeCost(i, 1));
				hn.upgradeCore(i, 1)
			}
		}
		await ns.sleep(500);
	}
}

/** @param {NS} ns */
function canPurchase(ns, purchaseCost, moneyLimit) {
	const currMoney = ns.getServerMoneyAvailable("home");
	return (currMoney - purchaseCost) > moneyLimit;
}
