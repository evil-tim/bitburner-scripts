const BATCH_CONFIG_FILE = "/batch/config/config.txt";

/** @param {NS} ns */
export function readConf(ns) {
	const config = [];
	const configRaw = ns.read(BATCH_CONFIG_FILE);
	const configLines = configRaw
		.split("\n")
		.map(line => line.trim())
		.filter(line => !line.startsWith("#"));
	for (let i in configLines) {
		const configLine = configLines[i];
		const configParts = configLine.split(" ")
			.map(part => part.trim())
			.filter(part => part !== "");
		if (configParts.length !== 2) {
			continue;
		}
		const target = configParts[0];
		if (!target) {
			continue;
		}
		const runners = configParts[1];
		if (!runners) {
			continue;
		}
		config.push({
			target: target,
			runners: runners.split(",")
				.map(runner => runner.trim())
				.filter(runner => runner !== "")
		});
	}
	return config;
}
