const ACTION_PORT = 14;

const SELF_SCRIPT = '/gang/main.js';

const MAX_WANTED_LEVEL = 1000;
const MIN_WANTED_LEVEL = 500;
const ACTIONS = {
	tw: setAllTerritoryWarfare,
	war: setAllTerritoryWarfare,

	th: setAllTrainHack,
	trainhack: setAllTrainHack,

	tc: setAllTrainCombat,
	traincombat: setAllTrainCombat,

	tch: setAllTrainCharisma,
	traincharisma: setAllTrainCharisma,

	e: setAllEarn,
	earn: setAllEarn,

	r: setAllRep,
	rep: setAllRep,
}
var GLOBAL_STATE = null;

/** @param {NS} ns */
export async function main(ns) {
	ns.disableLog("disableLog");
	ns.disableLog("sleep");
	if (!ns.gang.inGang()) {
		return;
	}
	if (ns.args[0]) {
		await sendAction(ns, ns.args[0]);
		if (!ns.getRunningScript(SELF_SCRIPT)) {
			ns.exec(SELF_SCRIPT, ns.getHostname());
		}
	} else {
		await mainLoop(ns);
	}
}

/** @param {NS} ns */
async function sendAction(ns, action) {
	await ns.writePort(ACTION_PORT, action);
}

/** @param {NS} ns */
function getAction(ns) {
	const action = ns.readPort(ACTION_PORT);
	return action !== "NULL PORT DATA" ? String(action) : null;
}

/** @param {NS} ns */
async function mainLoop(ns) {
	let currAction = null;
	while (true) {
		const action = getAction(ns);
		if (action && ACTIONS[action]) {
			currAction = action;
		}
		if (currAction) {
			ACTIONS[currAction](ns);
		}
		await ns.sleep(1000);
	}
}

/** @param {NS} ns */
function setAllTerritoryWarfare(ns) {
	setAllTask(ns, "Territory Warfare");
}

/** @param {NS} ns */
function setAllTrainHack(ns) {
	setAllTask(ns, "Train Hacking");
}

/** @param {NS} ns */
function setAllTrainCombat(ns) {
	setAllTask(ns, "Train Combat");
}

/** @param {NS} ns */
function setAllTrainCharisma(ns) {
	setAllTask(ns, "Train Charisma");
}

/** @param {NS} ns */
function setAllEarn(ns) {
	if (checkWantedLevelTooHigh(ns) ||
		(GLOBAL_STATE === "eh" && !checkWantedLevelTooLow(ns))) {
		setAllTask(ns, "Ethical Hacking");
		GLOBAL_STATE = "eh";
	} else {
		setAllTask(ns, "Money Laundering");
		GLOBAL_STATE = "e";
	}
}

/** @param {NS} ns */
function setAllRep(ns) {
	if (checkWantedLevelTooHigh(ns) ||
		(GLOBAL_STATE === "eh" && !checkWantedLevelTooLow(ns))) {
		setAllTask(ns, "Ethical Hacking");
		GLOBAL_STATE = "eh";
	} else {
		setAllTask(ns, "Cyberterrorism");
		GLOBAL_STATE = "e";
	}
}

/** @param {NS} ns */
function checkWantedLevelTooHigh(ns) {
	return ns.gang.getGangInformation().wantedLevel >= MAX_WANTED_LEVEL;
}

/** @param {NS} ns */
function checkWantedLevelTooLow(ns) {
	return ns.gang.getGangInformation().wantedLevel <= MIN_WANTED_LEVEL;
}

/** @param {NS} ns */
function setAllTask(ns, task) {
	ns.gang.getMemberNames()
		.map(name => ns.gang.getMemberInformation(name))
		.filter(member => member.task !== task)
		.forEach(member => ns.gang.setMemberTask(member.name, task));
}
