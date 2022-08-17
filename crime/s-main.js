const SUCCESS_THRESHOLD = 0.8;
const CRIMES = [
	"traffick illegal arms",
	"deal drugs",
	"homicide",
	"mug someone",
	"shoplift"
];

const BOOTSTRAP_JOB = { company: "Joe's Guns", position: "Employee" };

/** @param {NS} ns */
export async function main(ns) {
	ns.disableLog("disableLog");
	ns.disableLog("sleep");

	ns.tail();

	while (true) {
		let didCrime = false;
		for (const crime of CRIMES) {
			const chance = ns.singularity.getCrimeChance(crime);
			if (chance >= SUCCESS_THRESHOLD) {
				didCrime = true;
				ns.singularity.commitCrime(crime);
				await spinLoop(ns, ns.singularity.isBusy);
				ns.print("karma = " + await ns.heart.break());
				ns.print("kills = " + ns.getPlayer().numPeopleKilled);
				break;
			}

		}

		if (!didCrime) {
			const currentJobs = ns.getPlayer().jobs;
			if (currentJobs[BOOTSTRAP_JOB.company] === undefined ||
				currentJobs[BOOTSTRAP_JOB.company] !== BOOTSTRAP_JOB.position) {
				ns.singularity.applyToCompany(BOOTSTRAP_JOB.company, BOOTSTRAP_JOB.position);
			}
			if (!ns.getPlayer().isWorking) {
				ns.singularity.workForCompany(BOOTSTRAP_JOB.company, false);
			}
			await ns.sleep(1000);
		}
	}
}

/**
 * @param {NS} ns
 * @param {Function} condition
 */
async function spinLoop(ns, condition) {
	while (condition()) {
		await ns.sleep(1000);
	}
}
