import * as consts from "/batch/v2/consts.js"
import * as process from "/batch/v2/process.js"
import * as log from "/batch/v2/log.js"

/** @param {NS} ns */
export async function main(ns) {
	silenceLogs(ns);

	const runnersArg = ns.args[0];
	const runners = runnersArg.split(",")
		.map(runner => runner.trim())
		.filter(runner => runner !== "")
		.filter(runner => ns.serverExists(runner))
		.filter(runner => ns.hasRootAccess(runner));
	if (runners.length <= 0) {
		return;
	}

	const target = ns.args[1];
	if (!ns.serverExists(target) || !ns.hasRootAccess(target)) {
		return;
	}

	for (const runner of runners) {
		await ns.scp([
			consts.CONSTS_SCRIPT,
			consts.PROCESS_SCRIPT,
			consts.LOG_SCRIPT,
			consts.W_SCRIPT,
			consts.G_SCRIPT,
			consts.H_SCRIPT
		],
			runner);
	}

	let needSleep = true;
	while (true) {
		for (const runner of runners) {
			const threadStartTimes = calculateFullCycleThreadStartTimes(ns, target);
			let threadCounts = null;
			let threadGroupCount = 0;
			for (let i = 1; i <= 10000; i++) {
				const newThreadCounts = calculateThreadCounts(ns, runner, target, i);
				if (newThreadCounts === null) {
					break;
				}
				threadCounts = newThreadCounts;

				threadGroupCount = maxThreadGroupsInRunner(ns, runner, threadCounts);
				if (threadGroupCount <= consts.MAX_THREAD_GROUPS) {
					break;
				}
			}
			if (threadGroupCount === 0) {
				continue;
			}
			if (!canThreadGroupFitInRunner(ns, runner, threadCounts)) {
				continue;
			}
			const nonce = process.getAvailableNonce(ns, runner, target);
			if (isNaN(nonce)) {
				continue;
			}
			await log.info(ns, "Spawn group " + nonce + " at " + runner + "==>" + target
				+ " with " + threadCounts.t1Threads + ":" + threadCounts.t2Threads + ":" + threadCounts.t3Threads + ":" + threadCounts.t4Threads
			);
			if (threadCounts.t1Threads > 0) {
				ns.exec(consts.H_SCRIPT, runner, threadCounts.t1Threads, target, threadStartTimes.t1StartMs, "t1", nonce, threadStartTimes.hTimeMs);
			}
			if (threadCounts.t2Threads > 0) {
				ns.exec(consts.W_SCRIPT, runner, threadCounts.t2Threads, target, threadStartTimes.t2StartMs, "t2", nonce, threadStartTimes.wTimeMs);
			}
			if (threadCounts.t3Threads > 0) {
				ns.exec(consts.G_SCRIPT, runner, threadCounts.t3Threads, target, threadStartTimes.t3StartMs, "t3", nonce, threadStartTimes.gTimeMs);
			}
			if (threadCounts.t4Threads > 0) {
				ns.exec(consts.W_SCRIPT, runner, threadCounts.t4Threads, target, threadStartTimes.t4StartMs, "t4", nonce, threadStartTimes.wTimeMs);
			}
			await ns.sleep(consts.TIME_GAP_MS * 10);
			needSleep = false;
		}
		if (needSleep) {
			await ns.sleep(consts.TIME_GAP_MS * 10);
		}
		needSleep = true;
	}
}

/** @param {NS} ns */
function maxThreadGroupsInRunner(ns, runner, threadCounts) {
	const batchRamCost =
		threadCounts.t1Threads * ns.getScriptRam(consts.H_SCRIPT, runner) +
		threadCounts.t3Threads * ns.getScriptRam(consts.G_SCRIPT, runner) +
		(threadCounts.t2Threads + threadCounts.t4Threads) * ns.getScriptRam(consts.W_SCRIPT, runner);

	const maxRam = ns.getServerMaxRam(runner);
	return Math.floor(maxRam / batchRamCost);
}

/** @param {NS} ns */
function canThreadGroupFitInRunner(ns, runner, threadCounts) {
	const batchRamCost =
		threadCounts.t1Threads * ns.getScriptRam(consts.H_SCRIPT, runner) +
		threadCounts.t3Threads * ns.getScriptRam(consts.G_SCRIPT, runner) +
		(threadCounts.t2Threads + threadCounts.t4Threads) * ns.getScriptRam(consts.W_SCRIPT, runner);

	const maxRam = ns.getServerMaxRam(runner);
	const usedRam = ns.getServerUsedRam(runner);
	const freeRam = maxRam - usedRam;

	return batchRamCost <= freeRam;
}

/** @param {NS} ns */
function calculateFullCycleThreadStartTimes(ns, target) {
	const hTimeMs = Math.ceil(ns.getHackTime(target));
	const wTimeMs = Math.ceil(ns.getWeakenTime(target));
	const gTimeMs = Math.ceil(ns.getGrowTime(target));

	const maxTimeMs = Math.max(
		hTimeMs + 3 * consts.TIME_GAP_MS,
		wTimeMs + 2 * consts.TIME_GAP_MS,
		gTimeMs + 1 * consts.TIME_GAP_MS,
		wTimeMs
	);

	const t1StartMs = maxTimeMs - 3 * consts.TIME_GAP_MS - hTimeMs;
	const t2StartMs = maxTimeMs - 2 * consts.TIME_GAP_MS - wTimeMs;
	const t3StartMs = maxTimeMs - 1 * consts.TIME_GAP_MS - gTimeMs;
	const t4StartMs = maxTimeMs - wTimeMs;

	return {
		t1StartMs,
		t2StartMs,
		t3StartMs,
		t4StartMs,
		maxTimeMs,
		hTimeMs,
		wTimeMs,
		gTimeMs,
	}
}

/** @param {NS} ns */
function calculateThreadCounts(ns, runner, target, targetMultiplier) {
	const runnerCores = ns.getServer(runner).cpuCores;

	const weakenSecPerThread = ns.weakenAnalyze(1, runnerCores);
	const hackSecPerThread = 0.002; // ns.hackAnalyzeSecurity(1, target);
	const growSecPerThread = 0.004; // ns.growthAnalyzeSecurity(1, target, runnerCores);

	const hackPct = ns.hackAnalyze(target);
	if (targetMultiplier * hackPct > 1) {
		return null;
	}

	const targetGrowPct = 1 / (1 - (targetMultiplier * hackPct));
	const growThreads = ns.growthAnalyze(target, targetGrowPct, runnerCores);

	let hThread = -1;
	let gThread = -1;
	if (growThreads > 1) {
		hThread = targetMultiplier;
		gThread = Math.ceil(growThreads);
	} else {
		hThread = Math.floor(targetMultiplier / growThreads);
		gThread = 1;
	}

	// grow factor
	if (ns.getServerMaxMoney(target) * consts.MONEY_LIMIT > ns.getServerMoneyAvailable(target)) {
		hThread = Math.max(1, Math.round(hThread * 0.9));
	}

	const totalHSec = hThread * hackSecPerThread;
	let whThread = -1;
	if (totalHSec > weakenSecPerThread) {
		whThread = Math.ceil(totalHSec / weakenSecPerThread);
	} else {
		whThread = 1;
	}

	const totalGSec = gThread * growSecPerThread;
	let wgThread = -1;
	if (totalGSec > weakenSecPerThread) {
		wgThread = Math.ceil(totalGSec / weakenSecPerThread);
	} else {
		wgThread = 1;
	}

	return {
		t1Threads: hThread,
		t2Threads: whThread,
		t3Threads: gThread,
		t4Threads: wgThread,
		totalThreads: hThread + whThread + gThread + wgThread
	}
}

function clamp(value, min, max) {
	return Math.max(Math.min(value, max), min);
}

/** @param {NS} ns */
function silenceLogs(ns) {
	ns.disableLog("disableLog");
	ns.disableLog("getServerMaxRam");
	ns.disableLog("getServerUsedRam");
	ns.disableLog("sleep");
	ns.disableLog("scp");
	ns.disableLog("exec");
	ns.disableLog("getServerMoneyAvailable");
	ns.disableLog("getServerMaxMoney");
}
