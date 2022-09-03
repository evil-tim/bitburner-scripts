const CUSTOM_MARKER_CLASS = "custom_element";
const CUSTOM_ROW_ID_PREFIX = "custom_row_"

export function setupRows(stats) {
	// starting element
	const startingRow = getExtraHookRow();
	startingRow.after(
		...[].concat(
			...stats.map(createRowFromStat)
		),
		createNewDividerRow(),
	);
}

function createRowFromStat(stat, index) {
	const rowElements = [];
	rowElements.push(createNewTextRow(
		CUSTOM_ROW_ID_PREFIX + index,
		stat.color,
	));
	if (stat.pctGenerator) {
		rowElements.push(createNewProgressBarRow(
			CUSTOM_ROW_ID_PREFIX + "PB_" + index,
			stat.color,
		));
	}
	return rowElements;
}

export function cleanupRows() {
	getExtraHookContainer()
		.querySelectorAll("tr.custom_element")
		.forEach(e => e.remove());
}

export async function updateRows(stats) {
	await Promise.all(
		stats
			.map(async stat => {
				stat.value = await stat.generator();
				if (stat.pctGenerator) {
					stat.pctValue = await stat.pctGenerator();
				}
			})
	);

	stats.forEach((stat, index) => {
		updateTextRow(
			CUSTOM_ROW_ID_PREFIX + index,
			stat.name,
			stat.value
		);
		if (stat.pctGenerator) {
			updateProgressBarRow(
				CUSTOM_ROW_ID_PREFIX + "PB_" + index,
				stat.pctValue,
			);
		}
	});
}

export function getColors() {
	const container = getExtraHookContainer();
	const hpText = container.querySelector("tr:nth-of-type(1) th p");
	const moneyText = container.querySelector("tr:nth-of-type(2) th p");
	const levelText = container.querySelector("tr:nth-of-type(3) th p");

	const win = eval("window");

	return {
		color0: win.getComputedStyle(hpText).color,
		color1: win.getComputedStyle(moneyText).color,
		color2: win.getComputedStyle(levelText).color,
	};
}

function createNewTextRow(id, color) {
	const newRow = getExtraHookContainer()
		.querySelector("tr:nth-of-type(1)")
		.cloneNode(true);
	newRow.id = id;
	newRow.classList.add(CUSTOM_MARKER_CLASS);
	newRow
		.querySelectorAll("th p")
		.forEach(e => {
			e.innerText = "";
			e.style.color = color;
		});
	newRow
		.querySelectorAll("td p")
		.forEach(e => {
			e.innerText = "";
			e.style.color = color;
		});
	return newRow;
}

function updateTextRow(id, label, value) {
	const row = getExtraHookContainer()
		.querySelector("tr#" + id);
	row
		.querySelector("th p")
		.innerText = label;
	row
		.querySelector("td p")
		.innerText = value;
}

function createNewProgressBarRow(id, color) {
	const newRow = getExtraHookContainer()
		.querySelector("tr:nth-of-type(4)")
		.cloneNode(true);
	newRow.id = id;
	newRow.classList.add(CUSTOM_MARKER_CLASS);
	const progressElem = newRow
		.querySelector("th span span.MuiLinearProgress-bar");
	progressElem.style["background-color"] = color;
	progressElem.style.transform = "translateX(-100%)";
	return newRow;
}

function updateProgressBarRow(id, pct) {
	const actualPct = Math.min(1, Math.max(0, pct));
	const offset = (1 - actualPct) * 100;
	const row = getExtraHookContainer()
		.querySelector("tr#" + id);

	const progressElem = row
		.querySelector("th span span.MuiLinearProgress-bar");
	progressElem.style.transform = "translateX(-" + offset + "%)";
}

function createNewDividerRow() {
	const newRow = getExtraHookRow().cloneNode(true);
	newRow.classList.add(CUSTOM_MARKER_CLASS);
	newRow
		.querySelectorAll("th p")
		.forEach(e => e.remove());
	return newRow;
}

function getExtraHookRow() {
	return findParent(getCustomHookElement(), "tr");

}

function getExtraHookContainer() {
	return findParent(getCustomHookElement(), "tbody");
}

function getCustomHookElement() {
	return eval("document")
		.getElementById("overview-extra-hook-0");

}

function findParent(element, type) {
	let currElement = element;
	while (currElement && currElement.nodeName.toUpperCase() !== type.toUpperCase()) {
		currElement = currElement.parentElement;
	}
	return currElement;
}
