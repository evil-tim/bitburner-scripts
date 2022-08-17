/** @param {NS} ns */
export async function main(ns) {
	const host = ns.args[0];
	const cFile = ns.args[1];

	const data = ns.codingcontract.getData(cFile, host);
	ns.codingcontract.attempt(solve(ns, data), cFile, host);
}

/** @param {NS} ns */
function solve(ns, data) {
	ns.print(data);
	const length = data.length;
	let bestValue = NaN;
	let bestLength = NaN;
	let bestIndex = NaN;
	for (let i = 1; i <= length; i++) {
		for (let j = 0; j < length - (i - 1); j++) {
			const subarr = data.slice(j, j + i);
			const value = subarr.reduce((a, b) => a + b, 0);
			if (isNaN(bestValue) || value > bestValue) {
				bestValue = value;
				bestLength = i;
				bestIndex = j;
			}
		}
	}
	ns.print(bestValue + " " + bestIndex + " " + bestLength);
	return bestValue;
}
