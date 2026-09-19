import { readFile } from "node:fs/promises";
import { createRequire } from "node:module";
import path from "node:path";
import vm from "node:vm";
import { compileSource } from "./parser";
import { renderReact } from "./react";

export type Locals = Record<string, unknown>;
export type CompiledTemplate = (locals?: Locals) => Promise<string>;

export interface RenderOptions {
	/** Used for relative includes, module resolution, and error messages. */
	filename?: string;
}

interface RenderState {
	filename: string;
	ancestors: readonly string[];
}

const inlineFilename = path.join(process.cwd(), "__jst_inline__.jst");

function compileWithState(source: string, state: RenderState): CompiledTemplate {
	const javascript = compileSource(source);
	const script = new vm.Script(javascript, { filename: state.filename });

	return async (locals: Locals = {}): Promise<string> => {
		const output: string[] = [];
		const nodeRequire = createRequire(state.filename);
		const include = async (file: string, data: Locals = {}): Promise<string> => {
			if (typeof file !== "string") throw new TypeError("include path must be a string");
			const target = path.resolve(path.dirname(state.filename), file);
			if (state.ancestors.includes(target)) {
				throw new Error(`Circular template include: ${[...state.ancestors, target].join(" -> ")}`);
			}
			const content = await readFile(target, "utf8");
			return compileWithState(content, {
				filename: target,
				ancestors: [...state.ancestors, target],
			})(data);
		};
		const templateRequire = (moduleName: string, data: Locals = {}): unknown => {
			if (moduleName.endsWith(".jst")) {
				return include(moduleName, data).then((html) => {
					output.push(html);
				});
			}
			return nodeRequire(moduleName);
		};
		const context = vm.createContext({
			...locals,
			console,
			print: (value: unknown) => output.push(String(value)),
			printEscaped: (value: unknown) => output.push(escapeHtml(value)),
			include,
			require: templateRequire,
			renderReact,
		});
		await script.runInContext(context);
		return output.join("");
	};
}

export function escapeHtml(value: unknown): string {
	return String(value)
		.replace(/&/g, "&amp;")
		.replace(/</g, "&lt;")
		.replace(/>/g, "&gt;")
		.replace(/"/g, "&quot;")
		.replace(/'/g, "&#39;");
}

/** Compile once and render repeatedly with different locals. */
export function compile(source: string, options: RenderOptions = {}): CompiledTemplate {
	const filename = path.resolve(options.filename ?? inlineFilename);
	return compileWithState(source, { filename, ancestors: [filename] });
}

/** Render a template string. Templates are trusted JavaScript. */
export function render(source: string, locals: Locals = {}, options: RenderOptions = {}): Promise<string> {
	return compile(source, options)(locals);
}

/** Render a .jst file. Relative paths resolve from the current working directory. */
export async function renderFile(filename: string, locals: Locals = {}): Promise<string> {
	const absolute = path.resolve(filename);
	const source = await readFile(absolute, "utf8");
	return compile(source, { filename: absolute })(locals);
}

/** Express-compatible callback; register with app.engine("jst", __express). */
export function __express(
	filename: string,
	options: Locals,
	callback: (error: Error | null, html?: string) => void,
): void {
	renderFile(filename, options).then(
		(html) => callback(null, html),
		(error: unknown) => callback(error instanceof Error ? error : new Error(String(error))),
	);
}

export { renderReact } from "./react";
