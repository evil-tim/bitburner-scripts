/**
 * 0 - min money to keep | "adaptive"
 */

const MAX_NODES = 20;
const MAX_LEVEL = 200;
const MAX_RAM = 64;
const MAX_CORES = 16;

const MIN_MONEY = 100_000_000;

const ONE_HOUR_IN_SEC = 60 * 60;
const ADAPTIVE_PROD_WINDOW_HOURS = 6;

const LABEL_SIZE = 15;
const VALUE_SIZE = 8;

/** @param {NS} ns */
export async function main(ns) {
	ns.disableLog("disableLog");
	ns.disableLog("getServerMoneyAvailable");
	ns.disableLog("sleep");
	while (true) {
		const upgrades = getPossibleUpgrades(ns);

		const sortedUpgrades = upgrades.sort((a, b) =>
			a.gainRatePerCost === b.gainRatePerCost ?
				0 :
				a.gainRatePerCost > b.gainRatePerCost ?
					-1 : 1
		);
		const bestUpgrade = sortedUpgrades.length > 0 ? sortedUpgrades[0] : null;

		const moneyLimit = getMoneyLimit(ns);
		const currMoney = ns.getServerMoneyAvailable("home");
		const spendableMoney = Math.max(0, currMoney - moneyLimit);


		ns.clearLog();
		ns.printf("%-" + LABEL_SIZE + "s : %" + VALUE_SIZE + "s",
			"Money Limit",
			ns.nFormat(moneyLimit, "0.000a"),
		);
		ns.printf("%-" + LABEL_SIZE + "s : %" + VALUE_SIZE + "s",
			"Spendable Money",
			ns.nFormat(spendableMoney, "0.000a"),
		);
		ns.printf("%-" + LABEL_SIZE + "s : %s",
			"Best Upgrade",
			bestUpgrade !== null ? bestUpgrade.desc() : "none",
		);

		if (bestUpgrade !== null && bestUpgrade.cost <= spendableMoney) {
			bestUpgrade.apply(ns);
		} else {
			ns.print("\n");
		}

		await ns.sleep(1000);
	}
}

/** @param {NS} ns */
function getPossibleUpgrades(ns) {
	const nodeCount = ns.hacknet.numNodes();
	const upgrades = [];
	if (nodeCount < MAX_NODES) {
		upgrades.push(new BuyNodeAction(ns));
	}
	for (let i = 0; i < nodeCount; i++) {
		const nodeStats = ns.hacknet.getNodeStats(i);
		if (nodeStats.level < MAX_LEVEL) {
			upgrades.push(new UpgradeNodeLevelAction(ns, i));
		}
		if (nodeStats.ram < MAX_RAM) {
			upgrades.push(new UpgradeNodeRamAction(ns, i));
		}
		if (nodeStats.cores < MAX_CORES) {
			upgrades.push(new UpgradeNodeCoreAction(ns, i));
		}
	}
	return upgrades;
}

function getMoneyLimit(ns) {
	if (ns.args[0] && ns.args[0] === "adaptive") {
		return getTotalNodeProduction(ns) * ONE_HOUR_IN_SEC * ADAPTIVE_PROD_WINDOW_HOURS;
	} else if (ns.args[0] && !isNaN(Number(ns.args[0]))) {
		return Number(ns.args[0]);
	}
	return MIN_MONEY;
}

function getTotalNodeProduction(ns) {
	let totalProduction = 0;
	const nodeCount = ns.hacknet.numNodes();
	for (let i = 0; i < nodeCount; i++) {
		totalProduction += ns.hacknet.getNodeStats(i).production;
	}
	return totalProduction;
}

class HacknetNodeAction {
	cost;
	costFormatted;
	gainRate;
	gainRatePerCost;
	action;

	constructor(action) {
		this.action = action;
	}

	desc() {
		return "";
	}

	apply(ns) {
		ns.printf("%-" + LABEL_SIZE + "s : %s",
			"Applied action",
			this.desc(),
		);
		this.action();
	}
}

class BuyNodeAction extends HacknetNodeAction {

	/** @param {NS} ns */
	constructor(ns) {
		super(
			() => {
				ns.hacknet.purchaseNode();
			}
		);
		const playerMult = ns.getPlayer().mults.hacknet_node_money;
		this.cost = ns.hacknet.getPurchaseNodeCost();
		this.costFormatted = ns.nFormat(this.cost, "0.000a");
		this.gain = playerMult * ns.formulas.hacknetNodes.moneyGainRate(1, 1, 1);
		this.gainRatePerCost = this.gain / this.cost;
	}

	desc() {
		return "Buy Node for " + this.costFormatted;
	}
}

class UpgradeNodeAction extends HacknetNodeAction {
	index;

	/** @param {NS} ns */
	constructor(index, action) {
		super(action);
		this.index = index;
	}

}

class UpgradeNodeLevelAction extends UpgradeNodeAction {

	/** @param {NS} ns */
	constructor(ns, index) {
		super(
			index,
			() => ns.hacknet.upgradeLevel(index, 1)
		);
		const playerMult = ns.getPlayer().mults.hacknet_node_money;
		const nodeStats = ns.hacknet.getNodeStats(index);
		this.cost = ns.hacknet.getLevelUpgradeCost(index, 1);
		this.costFormatted = ns.nFormat(this.cost, "0.000a");
		const baseGain = playerMult * ns.formulas.hacknetNodes.moneyGainRate(nodeStats.level, nodeStats.ram, nodeStats.cores);
		const upgradeGain = playerMult * ns.formulas.hacknetNodes.moneyGainRate(nodeStats.level + 1, nodeStats.ram, nodeStats.cores);
		this.gain = upgradeGain - baseGain;
		this.gainRatePerCost = this.gain / this.cost;
	}

	desc() {
		return "Upgrade Node " + this.index + " level for " + this.costFormatted;
	}
}

class UpgradeNodeRamAction extends UpgradeNodeAction {

	/** @param {NS} ns */
	constructor(ns, index) {
		super(
			index,
			() => ns.hacknet.upgradeRam(index, 1)
		);
		const playerMult = ns.getPlayer().mults.hacknet_node_money;
		const nodeStats = ns.hacknet.getNodeStats(index);
		this.cost = ns.hacknet.getRamUpgradeCost(index, 1);
		this.costFormatted = ns.nFormat(this.cost, "0.000a");
		const baseGain = playerMult * ns.formulas.hacknetNodes.moneyGainRate(nodeStats.level, nodeStats.ram, nodeStats.cores);
		const upgradeGain = playerMult * ns.formulas.hacknetNodes.moneyGainRate(nodeStats.level, nodeStats.ram + 1, nodeStats.cores);
		this.gain = upgradeGain - baseGain;
		this.gainRatePerCost = this.gain / this.cost;
	}

	desc() {
		return "Upgrade Node " + this.index + " RAM for " + this.costFormatted;
	}
}

class UpgradeNodeCoreAction extends UpgradeNodeAction {

	/** @param {NS} ns */
	constructor(ns, index) {
		super(
			index,
			() => ns.hacknet.upgradeCore(index, 1)

		);
		const playerMult = ns.getPlayer().mults.hacknet_node_money;
		const nodeStats = ns.hacknet.getNodeStats(index);
		this.cost = ns.hacknet.getCoreUpgradeCost(index, 1);
		this.costFormatted = ns.nFormat(this.cost, "0.000a");
		const baseGain = playerMult * ns.formulas.hacknetNodes.moneyGainRate(nodeStats.level, nodeStats.ram, nodeStats.cores);
		const upgradeGain = playerMult * ns.formulas.hacknetNodes.moneyGainRate(nodeStats.level, nodeStats.ram, nodeStats.cores + 1);
		this.gain = upgradeGain - baseGain;
		this.gainRatePerCost = this.gain / this.cost;
	}

	desc() {
		return "Upgrade Node " + this.index + " Core for " + this.costFormatted;
	}
}
