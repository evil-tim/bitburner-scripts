const SUCCESS_THRESHOLD = 0.8;
const KILL_GOAL = 100;
const BOOTSTRAP_JOB = { company: "Joe's Guns", position: "Employee" };
const CRIMES = [
	{ code: "TRAFFICKARMS", name: "traffick illegal arms" },
	{ code: "DRUGS", name: "deal drugs" },
	{ code: "HOMICIDE", name: "homicide" },
	{ code: "MUG", name: "mug someone" },
	{ code: "SHOPLIFT", name: "shoplift" },
];

/** @param {NS} ns */
export async function main(ns) {
	ns.disableLog("disableLog");
	ns.disableLog("sleep");

	while (true) {
		const bestCrime = findBestCrime(ns);
		const currWork = ns.singularity.getCurrentWork() ?? { type: "NONE" };

		if (bestCrime === null) {
			doCompanyJob(ns, currWork);
		} else {
			doCrime(ns, currWork, bestCrime);
		}

		ns.clearLog();
		ns.print("karma = " + await ns.heart.break());
		ns.print("kills = " + ns.getPlayer().numPeopleKilled);
		await ns.sleep(2000);
	}
}

/** @param {NS} ns */
function doCompanyJob(ns, currWork) {
	const currentJobs = ns.getPlayer().jobs;
	if (currentJobs[BOOTSTRAP_JOB.company] === undefined ||
		currentJobs[BOOTSTRAP_JOB.company] !== BOOTSTRAP_JOB.position) {
		ns.singularity.applyToCompany(BOOTSTRAP_JOB.company, BOOTSTRAP_JOB.position);
	}
	if (currWork.type !== "COMPANY" && currWork.companyName !== BOOTSTRAP_JOB.company) {
		ns.singularity.workForCompany(BOOTSTRAP_JOB.company, true);
	}
}

/** @param {NS} ns */
function findBestCrime(ns) {
	const needMoreKills = ns.getPlayer().numPeopleKilled < KILL_GOAL;
	let foundHomicide = false;
	for (const crime of CRIMES) {
		if (!foundHomicide) {
			foundHomicide = crime.code === "HOMICIDE";
		}
		const chance = ns.singularity.getCrimeChance(crime.name);
		if (chance >= SUCCESS_THRESHOLD && (!needMoreKills || foundHomicide)) {
			return crime;
		}
	}
	return null;
}

/** @param {NS} ns */
function doCrime(ns, currWork, bestCrime) {
	if (currWork.type !== "CRIME" || currWork.crimeType !== bestCrime.code) {
		ns.singularity.commitCrime(bestCrime.name, false);
	}
}
