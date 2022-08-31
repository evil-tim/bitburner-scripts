const BASE_ID = "custom-hook-elem";

export async function updateExtraHooks(stats) {
	const { hook0, hook1 } = getExtraHooks();

	await Promise.all(stats.map(async stat => {
		stat.value = await stat.generator();
	}));

	stats.forEach((stat, index) => {
		const idLeft = createElementId(index, "left");
		const statLeftElement = hook0.querySelector("#" + idLeft);
		if (statLeftElement) {
			statLeftElement.innerText = stat.name + "\n";
		} else {
			const newElement = createTextElement(idLeft, stat.name, stat.color);
			hook0.appendChild(newElement);
		}

		const idRight = createElementId(index, "right");
		const statRightElement = hook1.querySelector("#" + idRight);
		if (statRightElement) {
			statRightElement.innerText = stat.value + "\n";
		} else {
			const newElement = createTextElement(idRight, stat.value, stat.color);
			hook1.appendChild(newElement);
		}

	});
}

function createElementId(id, pos) {
	return BASE_ID + "-" + pos + "-" + id;
}

function createTextElement(id, text, color) {
	const doc = eval("document");
	const newElement = doc.createElement("span");
	newElement.id = id;
	newElement.innerText = text + "\n";
	newElement.style.color = color;
	return newElement;
}

export function clearExtraHooks() {
	const { hook0, hook1 } = getExtraHooks();
	hook0.innerHTML = "";
	hook1.innerHTML = "";
}

export function getColors() {
	const { hook0, hook1 } = getExtraHooks();

	const rootTable = findParent(hook0, "table");
	const hpText = rootTable.querySelector("tr:nth-of-type(1) th p");
	const moneyText = rootTable.querySelector("tr:nth-of-type(2) th p");
	const levelText = rootTable.querySelector("tr:nth-of-type(3) th p");

	const win = eval("window");

	return {
		color0: win.getComputedStyle(hpText).color,
		color1: win.getComputedStyle(moneyText).color,
		color2: win.getComputedStyle(levelText).color,
	};
}

function findParent(element, type) {
	let currElement = element;
	while (currElement && currElement.nodeName.toUpperCase() !== type.toUpperCase()) {
		currElement = currElement.parentElement;
	}
	return currElement;
}

function getExtraHooks() {
	const doc = eval("document");
	return {
		hook0: doc.getElementById('overview-extra-hook-0'),
		hook1: doc.getElementById('overview-extra-hook-1'),
	};
}
