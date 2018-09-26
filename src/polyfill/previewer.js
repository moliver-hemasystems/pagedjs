import EventEmitter from "event-emitter";
import Hook from "../utils/hook";

import Chunker from '../chunker/chunker';
import Polisher from '../polisher/polisher';

import { registerHandlers, initializeHandlers } from '../utils/handlers';

class Previewer {
	constructor() {
		// this.preview = this.getParams("preview") !== "false";

		// Process styles
		this.polisher = new Polisher(false);

		// Chunk contents
		this.chunker = new Chunker();

		// Hooks
		this.hooks = {};

		// default size
		this.size = {
			width: {
				value: 8.5,
				unit: "in"
			},
			height: {
				value: 11,
				unit: "in"
			},
			format: undefined,
			orientation: undefined
		}

		let counter = 0;
		this.chunker.on("page", (page) => {
			counter += 1;
			this.emit("page", page);
			if (typeof window.PuppeteerLogger !== "undefined") {
				window.PuppeteerLogger("page", counter);
			}
		})

		this.chunker.on("rendering", () => {
			this.emit("rendering", this.chunker);
		})
	}

	initializeHandlers() {
		let handlers = initializeHandlers(this.chunker, this.polisher, this);

		handlers.on("size", (size) => {
			this.size = size;
		});

		return handlers;
	}

	registerHandlers() {
		return registerHandlers.apply(registerHandlers, arguments);
	}

	getParams(name) {
		let param;
		let url = new URL(window.location);
		let params = new URLSearchParams(url.search);
		for(var pair of params.entries()) {
			if(pair[0] === name) {
				param = pair[1];
			}
		}

		return param;
	}

	wrapContent() {
		// Wrap body in template tag
		let body = document.querySelector("body");

		// Check if a template exists
		let template;
		template = body.querySelector(":scope > template");

		if (!template) {
			// Otherwise create one
			template = document.createElement("template");
			template.innerHTML = body.innerHTML;
			body.innerHTML = '';
			body.appendChild(template);
		}

		return template.content;
	}

	removeStyles(doc=document) {
		// Get all stylesheets
		let stylesheets = Array.from(doc.querySelectorAll("link[rel='stylesheet']"));
		let hrefs = stylesheets.map((sheet) => {
			sheet.remove();
			return sheet.href;
		});

		// Get inline styles
		let inlineStyles = Array.from(doc.querySelectorAll("style:not([data-pagedjs-inserted-styles])"));
		inlineStyles.forEach((inlineStyle) => {
			let obj = {};
			obj[window.location.href] = inlineStyle.textContent;
			hrefs.push(obj);
			inlineStyle.remove();
		});

		return hrefs;
	}

	async preview(content, stylesheets, renderTo) {

		if (!content) {
			content = this.wrapContent();
		}

		if (!stylesheets) {
			stylesheets = this.removeStyles();
		}

		this.polisher.setup();

		let handlers = this.initializeHandlers();

		let styleText = await this.polisher.add(...stylesheets);

		let startTime = performance.now();

		// Render flow
		let flow = await this.chunker.flow(content, renderTo);

		let endTime = performance.now();
		let msg = "Rendering " + flow.total + " pages took " + (endTime - startTime) + " milliseconds.";

		this.emit("rendered", msg, this.size.width && this.size.width.value + this.size.width.unit, this.size.height && this.size.height.value + this.size.height.unit, this.size.orientation, this.size.format);
		if (typeof window.onPagesRendered !== "undefined") {
			window.onPagesRendered(msg, this.size.width && this.size.width.value + this.size.width.unit, this.size.height && this.size.height.value + this.size.height.unit, this.size.orientation, this.size.format);
		}

		return flow;
	}
}

EventEmitter(Previewer.prototype);

export default Previewer;
