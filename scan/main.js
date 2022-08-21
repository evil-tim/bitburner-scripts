import * as scan from "/scan/scan.js";

const CLEAR = "\x1b[0m";
const FG_GREEN = "\x1b[38;5;46m";
const FG_RED = "\x1b[38;5;197m";
const FG_ORANGE = "\x1b[38;5;208m";
const FG_ORANGE_RED = "\x1b[38;5;202m";
const FG_GRAY = "\x1b[38;5;244m";
const SEP_LEFT = "│";
const SEP_MID = FG_GRAY + "│" + CLEAR;
const SEP_SLASH = FG_GRAY + "/" + CLEAR;
const SEP_RIGHT = " ";

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
	ns.disableLog("getHackingLevel");
	ns.tail();

	while (true) {
		ns.clearLog();
		let servers = [
			...scan.getAllOwnedServers(ns)
				.sort((a, b) => a.name.localeCompare(b.name)),
			...scan.getAllExternServers(ns)
				.sort((a, b) => {
					if (a.level != b.level) {
						return a.level > b.level ? 1 : -1;
					}
					if (a.growth != b.growth) {
						return a.growth > b.growth ? 1 : -1;
					}
					return 0;
				})
		];
		const maxSec = Math.max(
			100,
			...servers.map(server => server.minSec),
			...servers.map(server => server.sec),
		);

		ns.printf("%-20s│%-5s%s%-6s│%-6s%s%-6s%s%-7s│%-18s│%-19s│%-19s",
			"Server",
			"Lvl",
			SEP_MID,
			"Growth",
			"Hack",
			SEP_MID,
			"Grow",
			SEP_MID,
			"Weak",
			"Money",
			"Security",
			"Memory"
		);
		ns.printf("%20s┼%12s┼%21s┼%18s┼%19s┼%19s",
			"────────────────────",
			"────────────",
			"─────────────────────",
			"──────────────────",
			"───────────────────",
			"───────────────────"
		);

		for (const server of servers) {
			const hackableServer = !server.ownServer && server.maxMoney > 0;
			const nameSegment = ns.sprintf("%s%-20s%s",
				server.root ? (server.backdoor ? FG_GREEN : CLEAR) : FG_RED,
				server.name,
				CLEAR,
			);
			const statsSegment = ns.sprintf("%s%s%5d%s%s%5d%s",
				SEP_LEFT,
				ns.getHackingLevel() < server.level ? FG_RED : CLEAR,
				server.level,
				CLEAR,
				SEP_MID,
				server.growth,
				SEP_RIGHT,
			);
			const timeSegment = ns.sprintf("%s%s%s%s%s%s%s",
				SEP_LEFT,
				hackableServer ? ns.sprintf("%6d", Math.round(ns.getHackTime(server.name) / 1000)) : FG_GRAY + "──────" + CLEAR,
				SEP_MID,
				hackableServer ? ns.sprintf("%6d", Math.round(ns.getGrowTime(server.name) / 1000)) : FG_GRAY + "──────" + CLEAR,
				SEP_MID,
				hackableServer ? ns.sprintf("%6d", Math.round(ns.getWeakenTime(server.name) / 1000)) : FG_GRAY + "──────" + CLEAR,
				SEP_RIGHT,
			);
			const moneySegment = ns.sprintf("%s%s%10s%s%s%6s%s",
				SEP_LEFT,
				hackableServer ? FG_ORANGE : CLEAR,
				hackableServer ? drawBarMoney(server.money, server.maxMoney) : FG_GRAY + "──────────" + CLEAR,
				CLEAR,
				SEP_MID,
				formatCurrency(server.maxMoney),
				SEP_RIGHT,
			);
			const secSegment = ns.sprintf("%s%s%10s%s%s%3d%s%3d%s",
				SEP_LEFT,
				hackableServer ? FG_ORANGE_RED : CLEAR,
				hackableServer ? drawBarSec(server.minSec, server.sec, maxSec) : FG_GRAY + "──────────" + CLEAR,
				CLEAR,
				SEP_MID,
				server.sec,
				SEP_SLASH,
				server.minSec,
				SEP_RIGHT,
			);
			const memSegment = ns.sprintf("%s%s%10s%s%s%7s%s",
				SEP_LEFT,
				server.mem > 0 ? FG_RED : CLEAR,
				server.mem > 0 ? drawBarMem(server.usedMem, server.mem) : FG_GRAY + "──────────" + CLEAR,
				CLEAR,
				SEP_MID,
				ns.nFormat(server.mem * 1e9, '0.0b'),
				SEP_RIGHT,
			);

			ns.printf("%s%s%s%s%s%s",
				nameSegment,
				statsSegment,
				timeSegment,
				moneySegment,
				secSegment,
				memSegment
			);
		}
		await ns.sleep(1000);
	}
}

function drawBarMoney(money, maxMoney) {
	const moneyRatio = Math.round(10 * (money / maxMoney));
	let bar = "";
	for (let i = 1; i <= 10; i++) {
		bar += i <= moneyRatio ? "█" : "░";
	}
	return bar;
}

function drawBarSec(minSec, sec, maxSec) {
	const secRatio = Math.round(10 * (sec / maxSec));
	const minSecRatio = Math.round(10 * (minSec / maxSec));
	let bar = "";
	for (let i = 1; i <= 10; i++) {
		if (i <= minSecRatio) {
			bar += "▒";
		} else if (i <= secRatio) {
			bar += "█";
		} else {
			bar += "░";
		}
	}
	return bar;
}

function drawBarMem(usedMem, mem) {
	const memRatio = Math.round(10 * (usedMem / mem));
	let bar = "";
	for (let i = 1; i <= 10; i++) {
		bar += i <= memRatio ? "█" : "░";
	}
	return bar;
}

function formatCurrency(value) {
	return Intl.NumberFormat('en-US', {
		notation: "compact",
		minimumFractionDigits: 1,
		maximumFractionDigits: 1
	}).format(value);
}
