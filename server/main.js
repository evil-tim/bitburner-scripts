/**
 * 0 - command - price | buy | remove
 * 1 - server name
 * 2 - RAM - 2 ^ X
 */

/** @param {NS} ns */
export async function main(ns) {
	let cmd = ns.args[0];
	let name = ns.args[1];
	let ram = ns.args[2];

	if (!cmd) {
		return;
	}

	if (cmd === "price") {
		printPrices(ns);
	} else if (cmd === "buy") {
		buyServer(ns, name, ram);
	} else if (cmd === "remove") {
		removeServer(ns, name);
	}
}

/** @param {NS} ns */
function printPrices(ns) {
	for (let i = 1; i <= 20; i++) {
		const ramValue = Math.pow(2, i);
		const cost = ns.getPurchasedServerCost(ramValue);
		ns.tprintf("%2d - %7s - %6s",
			i,
			ns.nFormat(ramValue * 1e9, "0.0b"),
			formatCurrency(cost)
		);
	}
}

/** @param {NS} ns */
function buyServer(ns, name, ram) {
	if (!name) {
		return;
	}
	if (ram <= 0) {
		return;
	}
	if (ns.serverExists(name)) {
		ns.tprintf("Server %s already exists.",
			name
		);
		return;
	}

	const ramValue = Math.pow(2, ram);
	const money = ns.getServerMoneyAvailable("home");
	const cost = ns.getPurchasedServerCost(ramValue);
	if (cost > money) {
		ns.tprintf("Not enough money to buy server %s. Costs %s",
			name,
			formatCurrency(cost)
		);
		return;
	}

	ns.purchaseServer(name, ramValue);
	ns.tprintf("Bought server %s for %s.",
		name,
		formatCurrency(cost)
	);
}

/** @param {NS} ns */
function removeServer(ns, name) {
	if (!name) {
		return;
	}
	if (!ns.serverExists(name)) {
		ns.tprintf("Server %s does not exist.",
			name
		);
		return;
	}

	ns.deleteServer(name);
	ns.tprintf("Removed server %s.",
		name
	);
}

function formatCurrency(value) {
	return Intl.NumberFormat('en-US', {
		notation: "compact",
		minimumFractionDigits: 1,
		maximumFractionDigits: 1
	}).format(value);
}
