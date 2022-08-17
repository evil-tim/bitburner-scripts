const CLEAR = "\x1b[0m";
const FG_GREEN = "\x1b[38;5;46m";
const FG_RED = "\x1b[38;5;197m";

/** @param {NS} ns */
export async function main(ns) {
	ns.tail();
	ns.clearLog();
	const allAugData = [];
	const player = ns.getPlayer();
	const money = player.money;
	const factions = player.factions;
	const ownedAugs = ns.singularity.getOwnedAugmentations(true);
	for (const faction of factions) {
		const factionRep = ns.singularity.getFactionRep(faction);
		const augs = ns.singularity.getAugmentationsFromFaction(faction);
		for (const aug of augs) {
			const augPrice = ns.singularity.getAugmentationPrice(aug);
			const augRep = ns.singularity.getAugmentationRepReq(aug);
			if (aug == 'NeuroFlux Governor' || (factionRep >= augRep && !ownedAugs.includes(aug))) {
				allAugData.push({
					faction: faction,
					aug: aug,
					augPrice: augPrice
				});
			}
		}
	}
	const sortedAugData = allAugData.sort((a, b) => {
		if (a.augPrice > b.augPrice) {
			return -1;
		} else if (a.augPrice < b.augPrice) {
			return 1;
		} else if (a.augPrice == b.augPrice) {
			return a.faction.localeCompare(b.faction);
		}
	});
	ns.printf("%-30s│%-50s│%-6s",
		"Faction",
		"Aug",
		"Price",
	);
	ns.printf("%-30s┼%-50s┼%-6s",
		"──────────────────────────────",
		"──────────────────────────────────────────────────",
		"──────");
	for (const augData of sortedAugData) {
		const highlightColor = money >= augData.augPrice ? FG_GREEN : FG_RED;
		ns.printf("%s%-30s%s│%s%-50s%s│%s%-6s%s",
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

function formatCurrency(value) {
	return Intl.NumberFormat('en-US', {
		notation: "compact",
		minimumFractionDigits: 1,
		maximumFractionDigits: 1
	}).format(value);
}
