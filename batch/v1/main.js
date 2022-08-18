import * as consts from "/batch/v1/consts.js"
import * as process from "/batch/v1/process.js"

const POLL_INTERVAL = 1000;

const MAX_SEC_LEVEL_INC = 5;
const MAX_MONEY_LEVEL = 1;
const MIN_MONEY_LEVEL_INC = 0.5;
const MAX_HG_RATIO = 0.5;

const THREAD_LIFE_FACTOR = 4;

/** @param {NS} ns */
export async function main(ns) {
	ns.disableLog("exec");
	ns.disableLog("sleep");
	ns.disableLog("getServerMinSecurityLevel");
	ns.disableLog("getServerSecurityLevel");
	ns.disableLog("getServerMaxMoney");
	ns.disableLog("getServerMoneyAvailable");


	let hostnames = [];
	let hostnamesArg = ns.args[0];
	if (!hostnamesArg) {
		hostnames.push(ns.getHostname());
	} else {
		hostnames = hostnamesArg.split(",")
			.map((runner) => runner.trim())
			.filter((runner) => runner !== "")
			.filter((runner) => ns.serverExists(runner))
			.filter((runner) => ns.hasRootAccess(runner));
	}
	if (hostnames.length <= 0) {
		return;
	}

	let target = ns.args[1];
	if (!ns.serverExists(target) || !ns.hasRootAccess(target)) {
		return;
	}

	const moneyRatio = MAX_MONEY_LEVEL;
	const minMoneyLevelInc = MIN_MONEY_LEVEL_INC;

	const totalRamPerHost = Object.fromEntries(
		hostnames
			.map(hostname => [
				hostname,
				ns.getServerMaxRam(hostname)
			]));
	const totalRam = Object.entries(totalRamPerHost)
		.map(e => e[1])
		.reduce((a, b) => a + b, 0);

	const usedRamPerHost = Object.fromEntries(
		hostnames
			.map(hostname => [
				hostname,
				ns.getServerUsedRam(hostname)
			]));
	const usedRam = Object.entries(usedRamPerHost)
		.map(e => e[1])
		.reduce((a, b) => a + b, 0);

	const threadRam = Math.max(
		ns.getScriptRam(consts.W_SCRIPT),
		ns.getScriptRam(consts.G_SCRIPT),
		ns.getScriptRam(consts.H_SCRIPT)
	);
	const totalThreadsPerHost = Object.fromEntries(
		hostnames
			.map(hostname => [
				hostname,
				Math.floor((totalRamPerHost[hostname] - usedRamPerHost[hostname]) / threadRam)
			]));
	const totalThreads = Object.entries(totalThreadsPerHost)
		.map(e => e[1])
		.reduce((a, b) => a + b, 0);


	let buffSize = 1;
	const spawnStats = new ThreadStats(buffSize);
	const moneyStats = new StatBuffer(buffSize);

	for (const hostname of hostnames) {
		await ns.scp([
			consts.W_SCRIPT,
			consts.G_SCRIPT,
			consts.H_SCRIPT
		],
			hostname);
	}

	while (true) {
		ns.clearLog();

		// compute base ratios
		const serverMinSec = ns.getServerMinSecurityLevel(target);
		const serverCurrSec = ns.getServerSecurityLevel(target);

		const serverMaxMoney = ns.getServerMaxMoney(target);
		const serverCurrMoney = ns.getServerMoneyAvailable(target);

		moneyStats.push(serverCurrMoney / serverMaxMoney);

		const { wRatio, gRatio, hRatio } = calculateThreadRatio(
			serverCurrSec, serverMinSec, MAX_SEC_LEVEL_INC,
			serverCurrMoney, serverMaxMoney, moneyRatio, minMoneyLevelInc
		);

		// compute number of threads
		const wThreadsRaw = wRatio * totalThreads;
		const gThreadsRaw = gRatio * totalThreads;
		const hThreadsRaw = hRatio * totalThreads;

		const wThreads = Math.round(wThreadsRaw);
		const gThreads = Math.round(wThreadsRaw + gThreadsRaw) - wThreads;
		const hThreads = Math.round(wThreadsRaw + gThreadsRaw + hThreadsRaw) - wThreads - gThreads;

		// get active threads
		const wActThreadsPerHost = Object.fromEntries(
			hostnames
				.map(hostname => [
					hostname,
					process.countRunningThreads(ns, consts.W_SCRIPT, hostname, target)
				]));
		const gActThreadsPerHost = Object.fromEntries(
			hostnames
				.map(hostname => [
					hostname,
					process.countRunningThreads(ns, consts.G_SCRIPT, hostname, target)
				]));
		const hActThreadsPerHost = Object.fromEntries(
			hostnames
				.map(hostname => [
					hostname,
					process.countRunningThreads(ns, consts.H_SCRIPT, hostname, target)
				]));

		const wActThreads = Object.entries(wActThreadsPerHost)
			.map(e => e[1])
			.reduce((a, b) => a + b, 0);
		const gActThreads = Object.entries(gActThreadsPerHost)
			.map(e => e[1])
			.reduce((a, b) => a + b, 0);
		const hActThreads = Object.entries(hActThreadsPerHost)
			.map(e => e[1])
			.reduce((a, b) => a + b, 0);

		// compute needed threads
		const freeThreads = totalThreads - (wActThreads + gActThreads + hActThreads);

		const wNeededThreads = wThreads - wActThreads;
		const gNeededThreads = gThreads - gActThreads;
		const hNeededThreads = hThreads - hActThreads;

		// spawn threads
		let wAddedThread = 0;
		let gAddedThread = 0;
		let hAddedThread = 0;
		for (const hostname of hostnames) {
			let {
				wAddedThreadForHost,
				gAddedThreadForHost,
				hAddedThreadForHost
			} = spawnThreads(
				ns,
				hostname,
				target,
				wNeededThreads - wAddedThread,
				gNeededThreads - gAddedThread,
				hNeededThreads - hAddedThread,
				totalThreadsPerHost[hostname] - wActThreadsPerHost[hostname] - gActThreadsPerHost[hostname] - hActThreadsPerHost[hostname],
				Math.max(1, Math.floor(totalThreads / process.MAX_FRAGMENTATION))
			);
			wAddedThread += wAddedThreadForHost;
			gAddedThread += gAddedThreadForHost;
			hAddedThread += hAddedThreadForHost;
		}

		// update stats window
		spawnStats.push(wAddedThread, gAddedThread, hAddedThread);
		const { wAvg: wSpawnAvg, gAvg: gSpawnAvg, hAvg: hSpawnAvg } = spawnStats.avg();
		const allSpawnAvg = wSpawnAvg + gSpawnAvg + hSpawnAvg;
		const avgThreadLifespan = Math.round(totalThreads / allSpawnAvg);
		const targetBuffSize = allSpawnAvg <= 0 ? Infinity : Math.max(1, THREAD_LIFE_FACTOR * avgThreadLifespan) + 1;
		if (buffSize < targetBuffSize) {
			buffSize++;
		} else if (buffSize > targetBuffSize) {
			buffSize--;
		}
		spawnStats.resize(buffSize);
		moneyStats.resize(buffSize)

		// print information
		const colSize = 16;
		const tSize = 7;

		printHeader(ns, colSize, target, hostnames,
			serverCurrSec, serverMinSec,
			serverCurrMoney, serverMaxMoney, moneyStats.beta(),
			totalRam, usedRam, threadRam,
			totalThreads,
			wActThreads, gActThreads, hActThreads, freeThreads,
			buffSize, targetBuffSize,
			allSpawnAvg,
			avgThreadLifespan
		);

		printThreadCurrInfo(ns, colSize, tSize,
			wRatio, gRatio, hRatio,
			wThreads, gThreads, hThreads,
			wActThreads, gActThreads, hActThreads,
			wNeededThreads, gNeededThreads, hNeededThreads,
			wAddedThread, gAddedThread, hAddedThread
		);

		await ns.sleep(POLL_INTERVAL);
	}
}


function calculateThreadRatio(serverCurrSec, serverMinSec, maxSecLevel,
	serverCurrMoney, serverMaxMoney, moneyRatio, minMoneyLevelInc) {
	const wRatio = Math.min(
		Math.max(
			0,
			serverCurrSec - serverMinSec
		),
		maxSecLevel
	) / maxSecLevel;
	const otherRatio = 1 - wRatio;

	const baseHRatio = Math.min(
		1,
		Math.max(
			0,
			Math.min(
				serverCurrMoney / serverMaxMoney,
				moneyRatio
			) - (moneyRatio - minMoneyLevelInc)
		) / minMoneyLevelInc
	) * MAX_HG_RATIO;
	const baseGRatio = 1 - baseHRatio;

	const gRatio = baseGRatio * otherRatio;
	const hRatio = baseHRatio * otherRatio;

	return {
		wRatio,
		gRatio,
		hRatio
	};
}

/** @param {NS} ns */
function printHeader(ns, colSize, target, hostnames,
	serverCurrSec, serverMinSec,
	serverCurrMoney, serverMaxMoney, moneyBeta,
	totalRam, usedRam, threadRam,
	totalThreads,
	wActThreads, gActThreads, hActThreads, freeThreads,
	buffSize, targetBuffSize,
	allSpawnAvg,
	avgThreadLifespan) {

	ns.printf("------------------------------------------------------------------");
	ns.printf("%-" + colSize + "s | %s",
		"Target",
		target
	);

	const hostnameChunks = hostnames.reduce((resultArray, item, index) => {
		const chunkIndex = Math.floor(index / 4)

		if (!resultArray[chunkIndex]) {
			resultArray[chunkIndex] = []
		}

		resultArray[chunkIndex].push(item)

		return resultArray
	}, []);

	let isFirst = true;
	for (const hostnameChunk of hostnameChunks) {
		if (isFirst) {
			ns.printf("%-" + colSize + "s | %s",
				"Runner",
				hostnameChunk.join(",")
			);
			isFirst = false;
		} else {
			ns.printf("%-" + colSize + "s | %s",
				"",
				hostnameChunk.join(",")
			);
		}
	}

	ns.printf("%-" + colSize + "s | %12.2f | %12.2f | %12s |",
		"Sec",
		serverCurrSec,
		serverMinSec,
		""
	);
	ns.printf("%-" + colSize + "s | %12s | %12s | %12.4f |",
		"Money",
		formatCurrency(serverCurrMoney),
		formatCurrency(serverMaxMoney),
		moneyBeta * 100
	);
	ns.printf("%-" + colSize + "s | %10dGB | %10dGB | %12s |",
		"RAM",
		totalRam - usedRam,
		totalRam,
		""
	);
	ns.printf("%-" + colSize + "s | %10dGB | %10dGB | %12s |",
		"T RAM",
		(wActThreads + gActThreads + hActThreads) * threadRam,
		totalThreads * threadRam,
		""
	);
	ns.printf("%-" + colSize + "s | %12d | %12d | %12d |",
		"T Count",
		wActThreads + gActThreads + hActThreads,
		freeThreads,
		totalThreads
	);
	ns.printf("%-" + colSize + "s | %9.5fT/s | %12s | %12s |",
		"T Spawn Rate",
		allSpawnAvg,
		"",
		""
	);
	ns.printf("%-" + colSize + "s | %11ds | %12s | %12s |",
		"Avg T Lifespan",
		avgThreadLifespan,
		"",
		""
	);
	ns.printf("%-" + colSize + "s | %11ds | %11ds | %12s |",
		"Stat Window",
		buffSize,
		targetBuffSize,
		""
	);
}

/** @param {NS} ns */
function printThreadCurrInfo(ns, colSize, tSize,
	wRatio, gRatio, hRatio,
	wThreads, gThreads, hThreads,
	wActThreads, gActThreads, hActThreads,
	wNeededThreads, gNeededThreads, hNeededThreads,
	wAddedThread, gAddedThread, hAddedThread) {

	ns.printf("------------------------------------------------------------------");
	ns.printf("%-" + colSize + "s | %" + tSize + "s | %" + tSize + "s | %" + tSize + "s | %" + tSize + "s |",
		"",
		"W",
		"G",
		"H",
		"Total"
	);
	ns.printf("------------------------------------------------------------------");
	ns.printf("%-" + colSize + "s | %" + tSize + ".2f | %" + tSize + ".2f | %" + tSize + ".2f | %" + tSize + ".2f |",
		"T Ratio",
		wRatio,
		gRatio,
		hRatio,
		wRatio + gRatio + hRatio
	);
	ns.printf("%-" + colSize + "s | %" + tSize + "d | %" + tSize + "d | %" + tSize + "d | %" + tSize + "d |",
		"T Ratio Calc",
		wThreads,
		gThreads,
		hThreads,
		wThreads + gThreads + hThreads
	);
	ns.printf("%-" + colSize + "s | %" + tSize + "d | %" + tSize + "d | %" + tSize + "d | %" + tSize + "d |",
		"T Used",
		wActThreads,
		gActThreads,
		hActThreads,
		wActThreads + gActThreads + hActThreads
	);
	ns.printf("%-" + colSize + "s | %" + tSize + "d | %" + tSize + "d | %" + tSize + "d | %" + tSize + "s |",
		"T Needed",
		wNeededThreads,
		gNeededThreads,
		hNeededThreads,
		""
	);
	ns.printf("%-" + colSize + "s | %" + tSize + "d | %" + tSize + "d | %" + tSize + "d | %" + tSize + "d |",
		"T Added",
		wAddedThread,
		gAddedThread,
		hAddedThread,
		wAddedThread + gAddedThread + hAddedThread
	);
	ns.printf("------------------------------------------------------------------");
}

/** @param {NS} ns */
function spawnThreads(ns, hostname, target, wNeededThreads, gNeededThreads, hNeededThreads, hostThreadCapacity, maxThreads) {
	const wNonce = process.getAvailableNonce(ns, consts.W_SCRIPT, hostname, target);
	const gNonce = process.getAvailableNonce(ns, consts.G_SCRIPT, hostname, target);
	const hNonce = process.getAvailableNonce(ns, consts.H_SCRIPT, hostname, target);

	const wAddedThreadForHost = isNaN(wNonce) ? 0 : Math.max(0, Math.min(wNeededThreads, maxThreads, hostThreadCapacity));
	hostThreadCapacity -= wAddedThreadForHost;
	const gAddedThreadForHost = isNaN(gNonce) ? 0 : Math.max(0, Math.min(gNeededThreads, maxThreads, hostThreadCapacity));
	hostThreadCapacity -= gAddedThreadForHost;
	const hAddedThreadForHost = isNaN(hNonce) ? 0 : Math.max(0, Math.min(hNeededThreads, maxThreads, hostThreadCapacity));
	hostThreadCapacity -= hAddedThreadForHost;

	if (wAddedThreadForHost > 0) {
		ns.exec(consts.W_SCRIPT, hostname, wAddedThreadForHost, target, wNonce);
	}
	if (gAddedThreadForHost > 0) {
		ns.exec(consts.G_SCRIPT, hostname, gAddedThreadForHost, target, gNonce);
	}
	if (hAddedThreadForHost > 0) {
		ns.exec(consts.H_SCRIPT, hostname, hAddedThreadForHost, target, hNonce);
	}

	return {
		wAddedThreadForHost,
		gAddedThreadForHost,
		hAddedThreadForHost
	};
}


function formatCurrency(value) {
	return Intl.NumberFormat('en-US', {
		notation: "compact",
		maximumFractionDigits: 1
	}).format(value);
}

class ThreadStats {
	wBuffer;
	gBuffer;
	hBuffer;

	constructor(size) {
		this.wBuffer = new StatBuffer(size);
		this.gBuffer = new StatBuffer(size);
		this.hBuffer = new StatBuffer(size);
	}

	resize(size) {
		this.wBuffer.resize(size);
		this.gBuffer.resize(size);
		this.hBuffer.resize(size);
	}

	push(wValue, gValue, hValue) {
		this.wBuffer.push(wValue);
		this.gBuffer.push(gValue);
		this.hBuffer.push(hValue);
	}

	avg() {
		return {
			"wAvg": this.wBuffer.avg(),
			"gAvg": this.gBuffer.avg(),
			"hAvg": this.hBuffer.avg()
		}
	}
}

class StatBuffer {
	size = 0;
	buffer = [];

	constructor(size) {
		this.size = size;
	}

	resize(size) {
		this.size = size;
	}

	push(value) {
		this.buffer.push(value);
		while (this.buffer.length > this.size) {
			this.buffer.shift();
		}
	}

	sum() {
		return this.buffer.reduce((a, b) => a + b, 0);
	}

	avg() {
		return this.sum() / this.buffer.length;
	}

	beta() {
		if (this.buffer.length <= 1) {
			return 0;
		}
		const xAvg = (this.buffer.length + 1) / 2;
		const yAvg = this.avg();
		return this.buffer.reduce((accum, y, x) => accum + ((x - xAvg + 1) * (y - yAvg)), 0) /
			this.buffer.reduce((accum, _y, x) => accum + ((x - xAvg + 1) ** 2), 0);
	}

}
