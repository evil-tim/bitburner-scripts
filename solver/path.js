/** @param {NS} ns */
export async function main(ns) {
	const host = ns.args[0];
	const cFile = ns.args[1];

	const data = ns.codingcontract.getData(cFile, host);
	ns.codingcontract.attempt(solve(ns, data), cFile, host);
}

/** @param {NS} ns */
function solve(ns, data) {
	const startRow = 0;
	const startCol = 0;

	const rows = data.length;
	const cols = data[0].length;
	for (let i = 0; i < rows; i++) {
		for (let j = 0; j < cols; j++) {
			if (data[i][j] == 1) {
				data[i][j] = -1;
			} else {
				data[i][j] = 0;
			}
		}
	}

	let pathIndex = 1;
	data[startRow][startCol] = pathIndex;

	let canPath = false;
	do {
		canPath = false;
		for (let i = 0; i < rows; i++) {
			for (let j = 0; j < cols; j++) {
				if (data[i][j] == -1) {
					continue;
				}
				if (startRow == i && startCol == j) {
					continue;
				}
				if (data[i][j] == 0 && hasNeighborWithPathIndex(data, i, j, pathIndex)) {
					data[i][j] = pathIndex + 1;
					canPath = true;
				}
			}
		}
		pathIndex++;
	} while (canPath);
	return getDirections(ns, data);
}

function hasNeighborWithPathIndex(data, row, column, pathIndex) {
	const rows = data.length;
	const cols = data[0].length;
	return (row - 1 >= 0 && data[row - 1][column] == pathIndex) ||
		(row + 1 < rows && data[row + 1][column] == pathIndex) ||
		(column - 1 >= 0 && data[row][column - 1] == pathIndex) ||
		(column + 1 < cols && data[row][column + 1] == pathIndex);
}

/** @param {NS} ns */
function getDirections(ns, data) {
	const startRow = 0;
	const startCol = 0;

	const rows = data.length;
	const cols = data[0].length;

	const endRow = rows - 1;
	const endCol = cols - 1;

	if (data[endRow][endCol] == 0) {
		return "";
	} else {
		let pathEnded = false;
		let currStep = [endRow, endCol];
		const stepsReverse = [];
		stepsReverse.push(currStep);
		while (!pathEnded) {
			currStep = findPrevStep(data, currStep);
			stepsReverse.push(currStep);
			if (currStep[0] == startRow && currStep[1] == startCol) {
				pathEnded = true;
			}
		}
		printGrid(ns, data);
		const steps = stepsReverse.reverse();
		ns.print(steps);
		const directions = [];
		for(let i = 0; i < steps.length - 1 ; i++) {
			let currStep = steps[i];
			let nextStep = steps[i+1];
			if(currStep[0] < nextStep[0]){
				directions.push("D");
			} else if(currStep[0] > nextStep[0]){
				directions.push("U");
			} else if(currStep[1] < nextStep[1]){
				directions.push("R");
			} else if(currStep[1] > nextStep[1]){
				directions.push("L");
			}
		}
		return directions.join("");
	}
}

function findPrevStep(data, currStep) {
	const row = currStep[0];
	const column = currStep[1];

	const rows = data.length;
	const cols = data[0].length;

	const index = data[row][column];
	const prevIndex = index - 1;

	if (row - 1 >= 0 && data[row - 1][column] == prevIndex) {
		return [row - 1, column];
	}
	if (row + 1 < rows && data[row + 1][column] == prevIndex) {
		return [row + 1, column];
	}
	if (column - 1 >= 0 && data[row][column - 1] == prevIndex) {
		return [row, column - 1];
	}
	if (column + 1 < cols && data[row][column + 1] == prevIndex) {
		return [row, column + 1];
	}
}

/** @param {NS} ns */
function printGrid(ns, data) {
	const rows = data.length;
	for (let i = 0; i < rows; i++) {
		ns.print(data[i]);
	}
}
