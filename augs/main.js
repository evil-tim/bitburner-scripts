const CLEAR = "\x1b[0m";
const FG_GREEN = "\x1b[38;5;46m";
const FG_ORANGE = "\x1b[38;5;208m";
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
	const sortedAugData = allAugData.sort((a, b) => {
		if (a.augPrice > b.augPrice) {
			return -1;
		} else if (a.augPrice < b.augPrice) {
			return 1;
		} else if (a.augPrice == b.augPrice) {
			return a.faction.localeCompare(b.faction);
		}
	});

	const FACTION_LEN = 30;
	const AUG_LEN = 60;
	const PRICE_LEN = 6;

	ns.printf("%-" + FACTION_LEN + "s│%-" + AUG_LEN + "s│%-" + PRICE_LEN + "s",
		"Faction",
		"Aug",
		"Price",
	);
	ns.printf("%-" + FACTION_LEN + "s┼%-" + AUG_LEN + "s┼%-" + PRICE_LEN + "6s",
		"──────────────────────────────",
		"────────────────────────────────────────────────────────────",
		"──────");
	for (const augData of sortedAugData) {
		const highlightColor =
			money < augData.augPrice ?
				FG_RED :
				(
					augData.missingPrereqs.length > 0 ?
						FG_ORANGE :
						FG_GREEN
				);
		ns.printf("%s%-" + FACTION_LEN + "s%s│%s%-" + AUG_LEN + "s%s│%s%-" + PRICE_LEN + "s%s",
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
