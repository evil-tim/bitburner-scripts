import * as consts from "/batch/v2/consts.js"

/** @param {NS} ns */
export async function warn(ns, message){
	await ns.writePort(consts.LOG_PORT, currDate() + " WARN: " + message);
}

/** @param {NS} ns */
export async function info(ns, message){
	await ns.writePort(consts.LOG_PORT, currDate() + " INFO: " + message);
}

function currDate() {
	return new Date().toISOString();
}
