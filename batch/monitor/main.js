import * as v1consts from "/batch/v1/consts.js"
import * as v2consts from "/batch/v2/consts.js"

const GRAPH_HEIGHT = 110;
const GRAPH_WIDTH = 200;

const ENTRY_HEIGHT = GRAPH_HEIGHT + 35;

const CANVAS_WIDTH = 960;
const CONTAINER_WIDTH = CANVAS_WIDTH + 1;

const BACKGROUND_COLOR = "#101010";

const GRAPH_BACKGROUND_COLOR = "#000000";
const GRAPH_GUIDELINE_COLOR = "#555555";
const GRAPH_TEXT_COLOR = "#DDDDDD";
const GRAPH_DOT_COLOR = "#99FFFF";

/** @param {NS} ns */
export async function main(ns) {
	ns.disableLog("disableLog");
	ns.disableLog("sleep");

	const hostnames = getValidHostNames(ns);
	if (hostnames.length <= 0) {
		return;
	}

	const CANVAS_HEIGHT = ENTRY_HEIGHT * hostnames.length;
	const CONTAINER_HEIGHT = CANVAS_HEIGHT + 36;

	const doc = eval("document");
	const tailWindow = await setupTailWindow(ns, doc, CONTAINER_HEIGHT, CONTAINER_WIDTH);
	const canv = setupCanvas(ns, doc, tailWindow, CANVAS_HEIGHT, CANVAS_WIDTH);
	const ctx = canv.getContext("2d");

	const graphs = hostnames.map(hostname =>
		[
			new ScalingGraph(
				GRAPH_HEIGHT, GRAPH_WIDTH, 50, 25,
				"Money/Sec",
				() => getMoneyPerSecond(ns, hostname)
			),
			new Graph(
				GRAPH_HEIGHT, GRAPH_WIDTH, 50, 25,
				"Money",
				["0", formatCurrency(ns.getServerMaxMoney(hostname) / 2), formatCurrency(ns.getServerMaxMoney(hostname))],
				() => ns.getServerMoneyAvailable(hostname) / ns.getServerMaxMoney(hostname)
			),
			new ScalingGraph(
				GRAPH_HEIGHT, GRAPH_WIDTH, 50, 25,
				"Security",
				() => ns.getServerSecurityLevel(hostname)
			),
		]
	);


	while (true) {
		graphs.forEach(serverGraphs => serverGraphs.forEach(graph => graph.update()));

		background(canv, ctx, BACKGROUND_COLOR);
		graphs.forEach((serverGraphs, i) => {
			const yPos = ENTRY_HEIGHT * i;
			const hostname = hostnames[i];
			drawInfo(ctx, GRAPH_TEXT_COLOR,
				0, yPos,
				[
					hostname,
					"Security : " + ns.sprintf("%.2d", ns.getServerSecurityLevel(hostname)),
					"Money    : " + formatCurrency(ns.getServerMoneyAvailable(hostname))
				]
			);
			serverGraphs[0].draw(ctx, 150, yPos);
			serverGraphs[1].draw(ctx, 420, yPos);
			serverGraphs[2].draw(ctx, 690, yPos);
		});
		await ns.sleep(1000);
	}
}

/** @param {NS} ns */
function getValidHostNames(ns) {
	let hostnamesArg = ns.args[0];
	if (!hostnamesArg) {
		return [];
	}
	return hostnamesArg.split(",")
		.map(hostname => hostname.trim())
		.filter(hostname => hostname !== "")
		.filter(hostname => ns.serverExists(hostname))
		.filter(hostname => ns.hasRootAccess(hostname));
}

/**
 * @param {NS} ns
 * @param {document} doc
 */
async function getTailWindow(ns, doc) {
	ns.tail();
	while (true) {
		const tailWindow = doc.querySelector(".react-draggable:last-child .react-resizable:last-child");
		if (tailWindow !== null) {
			return tailWindow;
		}
		await ns.sleep(100);
	}
}

/**
 * @param {NS} ns
 * @param {document} doc
 */
async function setupTailWindow(ns, doc, height, width) {
	const tailWindow = await getTailWindow(ns, doc);
	tailWindow.children[1].style.display = "none";
	tailWindow.style.width = width + "px";
	tailWindow.style.height = height + "px";
	return tailWindow;
}

/**
 * @param {NS} ns
 * @param {document} doc
 */
function setupCanvas(ns, doc, tailWindow, height, width) {
	const canv = tailWindow.appendChild(doc.createElement("canvas"));
	canv.width = width;
	canv.height = height;

	ns.atExit(() => {
		canv.parentNode.removeChild(canv);
	});

	return canv;
}

function formatCurrency(value) {
	return Intl.NumberFormat('en-US', {
		notation: "compact",
		minimumFractionDigits: 1,
		maximumFractionDigits: 1
	}).format(value);
}

function line(ctx, style, width, xs, ys, xe, ye) {
	ctx.strokeStyle = style;
	ctx.lineWidth = width;
	ctx.beginPath();
	ctx.moveTo(xs, ys);
	ctx.lineTo(xe, ye);
	ctx.stroke();
}

function dot(ctx, style, x, y) {
	ctx.fillStyle = style;
	ctx.fillRect(x, y, 2, 2);
}

function rect(ctx, style, xs, ys, xe, ye) {
	ctx.fillStyle = style;
	ctx.fillRect(xs, ys, xe, ye);
}

function text(ctx, style, x, y, text) {
	ctx.fillStyle = style;
	ctx.fillText(text, x, y);
}

function background(canv, ctx, style) {
	ctx.fillStyle = style;
	ctx.fillRect(0, 0, canv.width, canv.height);
}

function drawInfo(ctx, style, x, y, info) {
	const infoX = x + 10;
	let infoY = y + 30;
	for (const line of info) {
		text(ctx, style, infoX, infoY, line);
		infoY += 12;
	}
}

/** @param {NS} ns */
function getMoneyPerSecond(ns, target) {
	const host = ns.getHostname();
	const processes = ns.ps(host);
	return processes
		.filter(process =>
			process.filename === v1consts.MAIN_SCRIPT ||
			process.filename === v2consts.MAIN_SCRIPT
		)
		.filter(process => process.args && process.args[1] && process.args[1] === target)
		.map(process => ns.getScriptIncome(process.filename, host, ...process.args))
		.reduce((a, b) => a + b, 0);
}

class Graph {

	height;
	width;
	leftPad;
	topPad;
	xLabels;
	label;
	dataSource;
	buffer;
	bufferSize;

	constructor(height, width, leftPad, topPad, label, xLabels, dataSource) {
		this.height = height;
		this.width = width;
		this.leftPad = leftPad;
		this.topPad = topPad;
		this.label = label;
		this.xLabels = xLabels;
		this.dataSource = dataSource;
		this.buffer = [];
		this.bufferSize = width - 2;
	}

	update() {
		this.buffer.push(this.dataSource());
		while (this.buffer.length > this.bufferSize) {
			this.buffer.shift();
		}
	}

	draw(ctx, x, y) {
		const graphX = this.leftPad + x;
		const graphY = this.topPad + y;

		rect(ctx, GRAPH_BACKGROUND_COLOR,
			x, graphY, this.leftPad + this.width, this.height,
		);

		line(ctx, GRAPH_GUIDELINE_COLOR, 1,
			graphX + this.width, graphY + this.height,
			graphX, graphY + this.height,
		);
		line(ctx, GRAPH_GUIDELINE_COLOR, 1,
			graphX, graphY + this.height,
			graphX, graphY,
		);
		line(ctx, GRAPH_GUIDELINE_COLOR, 1,
			graphX, graphY + Math.round(this.height / 2),
			graphX + this.width, graphY + Math.round(this.height / 2),
		);
		text(ctx, GRAPH_TEXT_COLOR, graphX, y + 15, this.label);
		this.drawXLabels(ctx, x, graphY);
		this.drawData(ctx, graphX, graphY);
	}

	drawXLabels(ctx, x, graphY) {
		text(ctx, GRAPH_TEXT_COLOR, x + 5, graphY + this.height - 5, this.xLabels[0]);
		text(ctx, GRAPH_TEXT_COLOR, x + 5, graphY + Math.round(this.height / 2), this.xLabels[1]);
		text(ctx, GRAPH_TEXT_COLOR, x + 5, graphY + 12, this.xLabels[2]);
	}

	drawData(ctx, graphX, graphY) {
		for (let i = 0; i < this.width - 2; i++) {
			const dotX = graphX + i + 1;
			const offset = this.width - 2 - this.buffer.length;
			const bufferIndex = i - offset;
			if (bufferIndex >= 0) {
				const dotY = graphY + Math.round(this.height * (1 - this.buffer[bufferIndex]));
				dot(ctx, GRAPH_DOT_COLOR, dotX, dotY);
			}
		}
	}

}

class ScalingGraph extends Graph {

	constructor(height, width, leftPad, topPad, label, dataSource) {
		super(height, width, leftPad, topPad, label, ["", "", ""], dataSource);
	}

	getScalingFloor() {
		const minValue = Math.min(...this.buffer);
		const oom = minValue > 0 ? Math.floor(Math.log10(minValue)) : 0;
		const oomBase = 10 ** oom;
		return oomBase * Math.floor(minValue / oomBase);
	}

	getScalingCeil() {
		const maxValue = Math.max(...this.buffer);
		const oom = maxValue > 0 ? Math.floor(Math.log10(maxValue)) : 0;
		const oomBase = 10 ** oom;
		return oomBase * (Math.floor(maxValue / oomBase) + 1);
	}

	getScalingFunction() {
		const scalingFloor = this.getScalingFloor();
		const scalingCeil = this.getScalingCeil();
		const scalingRange = scalingCeil - scalingFloor;
		return (value) => (value - scalingFloor) / scalingRange;
	}

	drawXLabels(ctx, x, graphY) {
		const scalingFloor = this.getScalingFloor();
		const scalingCeil = this.getScalingCeil();

		this.xLabels[0] = formatCurrency(scalingFloor);
		this.xLabels[1] = formatCurrency((scalingCeil + scalingFloor) / 2);
		this.xLabels[2] = formatCurrency(scalingCeil);
		super.drawXLabels(ctx, x, graphY);
	}

	drawData(ctx, graphX, graphY) {
		const scaledBuffer = this.buffer.map(this.getScalingFunction());

		for (let i = 0; i < this.width - 2; i++) {
			const dotX = graphX + i + 1;
			const offset = this.width - 2 - scaledBuffer.length;
			const bufferIndex = i - offset;
			if (bufferIndex >= 0) {
				const dotY = graphY + Math.round(this.height * (1 - scaledBuffer[bufferIndex]));
				dot(ctx, GRAPH_DOT_COLOR, dotX, dotY);
			}
		}
	}

}
