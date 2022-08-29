/**
 * 0 - command - buy
 */

import * as terminal from '/util/terminal.js'

const CLEAR = "\x1b[0m";
const FG_GREEN = "\x1b[38;5;46m";
const FG_ORANGE = "\x1b[38;5;208m";
const FG_RED = "\x1b[38;5;197m";

/** @param {NS} ns */
export async function main(ns) {
	do {
		const allAugData = getAllAugData(ns);
		const sortedAugData = allAugData.sort((a, b) => {
			if (a.augPrice > b.augPrice) {
				return -1;
			} else if (a.augPrice < b.augPrice) {
				return 1;
			} else if (a.augPrice == b.augPrice) {
				return a.faction.localeCompare(b.faction);
			}
		});
		sortedAugData.forEach((augData, i) => augData.index = i);

		printAugsTable(ns, sortedAugData);
		const augCount = sortedAugData.length;
		if (augCount === 0) {
			break;
		}
		if (ns.args[0] !== "buy") {
			break;
		}

		let selectedIndex = NaN;
		await terminal.terminalPrompt("Select aug to buy [0 - " + (augCount - 1) + "]").then(input => selectedIndex = Number(input));

		if (!isNaN(selectedIndex) && selectedIndex >= 0 && selectedIndex < augCount) {
			buyAug(ns, sortedAugData[selectedIndex]);
		} else {
			break;
		}
	} while (true);
}

/** @param {NS} ns */
function getAllAugData(ns) {
	const allAugData = [];
	const factions = ns.getPlayer().factions;
	const ownedAugs = ns.singularity.getOwnedAugmentations(true);
	for (const faction of factions) {
		const factionRep = ns.singularity.getFactionRep(faction);
		const augs = ns.singularity.getAugmentationsFromFaction(faction);
		for (const aug of augs) {
			const augPrice = ns.singularity.getAugmentationPrice(aug);
			const augRep = ns.singularity.getAugmentationRepReq(aug);

			const missingPrereqs = ns.singularity.getAugmentationPrereq(aug)
				.filter(prereq => !ownedAugs.includes(prereq));

			if (aug == 'NeuroFlux Governor' || (factionRep >= augRep && !ownedAugs.includes(aug))) {
				allAugData.push({
					faction: faction,
					aug: aug,
					augPrice: augPrice,
					missingPrereqs: missingPrereqs
				});
			}
		}
	}
	return allAugData;
}

/** @param {NS} ns */
function printAugsTable(ns, sortedAugData) {
	const INDEX_LEN = 3;
	const FACTION_LEN = 30;
	const AUG_LEN = 60;
	const PRICE_LEN = 6;

	ns.tprintf("%" + INDEX_LEN + "s│%-" + FACTION_LEN + "s│%-" + AUG_LEN + "s│%-" + PRICE_LEN + "s",
		"",
		"Faction",
		"Aug",
		"Price",
	);
	ns.tprintf("%" + INDEX_LEN + "s┼%-" + FACTION_LEN + "s┼%-" + AUG_LEN + "s┼%-" + PRICE_LEN + "6s",
		"───",
		"──────────────────────────────",
		"────────────────────────────────────────────────────────────",
		"──────");

	const money = ns.getPlayer().money;
	for (const augData of sortedAugData) {
		const highlightColor =
			money < augData.augPrice ?
				FG_RED :
				(
					augData.missingPrereqs.length > 0 ?
						FG_ORANGE :
						FG_GREEN
				);
		ns.tprintf("%-" + INDEX_LEN + "d│%s%-" + FACTION_LEN + "s%s│%s%-" + AUG_LEN + "s%s│%s%" + PRICE_LEN + "s%s",
			augData.index,
			highlightColor,
			augData.faction,
			CLEAR,
			highlightColor,
			augData.aug,
			CLEAR,
			highlightColor,
			formatCurrency(augData.augPrice),
			CLEAR
		);
	}
}

/** @param {NS} ns */
function buyAug(ns, augData) {
	ns.tprintf("buy " + augData.aug);
	ns.singularity.purchaseAugmentation(augData.faction, augData.aug);
}

function formatCurrency(value) {
	return Intl.NumberFormat('en-US', {
		notation: "compact",
		minimumFractionDigits: 1,
		maximumFractionDigits: 1
	}).format(value);
}
