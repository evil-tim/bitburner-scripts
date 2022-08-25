const PRIO_JOIN_FACTIONS = [
	"CyberSec",
	"NiteSec",
	"The Black Hand",
	"BitRunners",
	"Tian Di Hui",
	"Netburners",
	"Slum Snakes",
	"Tetrads",
	"The Syndicate",
	"Speakers for the Dead",
	"The Covenant",
	"Illuminati",
	"Daedalus"
];

/** @param {NS} ns */
export async function main(ns) {
	while (true) {
		ns.singularity.checkFactionInvitations()
			.filter(faction => PRIO_JOIN_FACTIONS.includes(faction))
			.forEach(faction => ns.singularity.joinFaction(faction));

		await ns.sleep(30000);
	}
}
