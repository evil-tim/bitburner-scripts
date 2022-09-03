const CAPACITY = 0.5;
const UPGRADE_SELL = "Sell for Money";

const LABEL_SIZE = 15;
const VALUE_SIZE = 8;

/** @param {NS} ns */
export async function main(ns) {
	ns.disableLog("disableLog");
	ns.disableLog("sleep");

	while (true) {
		const maxCache = ns.hacknet.hashCapacity();
		const targetCache = getTargetCache(ns, maxCache);
		const spendableHash = Math.max(0, ns.hacknet.numHashes() - targetCache);
		const upgradeHashCost = ns.hacknet.hashCost(UPGRADE_SELL);
		const upgradeCount = Math.floor(spendableHash / upgradeHashCost);


		ns.clearLog();
		ns.printf("%-" + LABEL_SIZE + "s : %" + VALUE_SIZE + "s",
			"Hash Limit",
			ns.nFormat(targetCache, "0.000a"),
		);
		ns.printf("%-" + LABEL_SIZE + "s : %" + VALUE_SIZE + "s",
			"Spendable Hash",
			ns.nFormat(spendableHash, "0.000a"),
		);

		if (upgradeCount > 0) {
			ns.hacknet.spendHashes(UPGRADE_SELL, "", upgradeCount);
		}


		await ns.sleep(1000);
	}
}

/** @param {NS} ns */
function getTargetCache(ns, maxCache) {
	const targetArg = ns.args[0];
	const targetArgNum = Number(targetArg);
	if (!isNaN(targetArgNum)) {
		return targetArgNum;
	}
	const targetArgString = String(targetArg);
	if (targetArgString.endsWith("%")) {
		const targetArgPct = Number(targetArgString.substring(0, targetArgString.length - 1));
		if(!isNaN(targetArgPct)) {
			return maxCache * (targetArgPct / 100);
		}
	}
	return maxCache * CAPACITY;
}
