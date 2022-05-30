import { nodeResolve } from "@rollup/plugin-node-resolve";
import commonjs from "@rollup/plugin-commonjs";
import json from "@rollup/plugin-json";
import license from "rollup-plugin-license";

import pkg from "./package.json";

const plugins = [
	nodeResolve({
		extensions: [".cjs",".mjs", ".js"]
	}),
	commonjs(),
	json(),
	license({
		banner: "@license Paged.js v<%= pkg.version %> | MIT | https://pagedjs.org",
	})
];

export default [
	// browser-friendly UMD build
	{
		input: pkg.main,
		output: {
			name: "Paged",
			file: pkg.browser.replace(".js", ".legacy.js"),
			format: "umd"
		},
		plugins: plugins
	},
	{
		input: "./lib/polyfill/polyfill.cjs",
		output: {
			name: "PagedPolyfill",
			file: "./dist/paged.legacy.polyfill.js",
			format: "umd"
		},
		plugins: plugins
	}
];
