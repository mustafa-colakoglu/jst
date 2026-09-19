type CodeFrame = {
	kind: "code";
	interpolation: boolean;
	depth: number;
	regexAllowed: boolean;
	parens: boolean[];
	pendingControl: boolean;
};
type Frame = CodeFrame | { kind: "string"; quote: "'" | '"' } | { kind: "template" } |
	{ kind: "regex"; characterClass: boolean } | { kind: "lineComment" } | { kind: "blockComment" };

export class TemplateSyntaxError extends SyntaxError {
	constructor(message: string, source: string, offset: number) {
		const before = source.slice(0, offset);
		const line = before.split(/\r\n|\r|\n/).length;
		const column = before.length - Math.max(before.lastIndexOf("\n"), before.lastIndexOf("\r"));
		super(`${message} at line ${line}, column ${column}`);
		this.name = "TemplateSyntaxError";
	}
}

/** Find a closing delimiter outside JavaScript strings, comments and regular expressions. */
function findClose(source: string, start: number): number {
	const frames: Frame[] = [{ kind: "code", interpolation: false, depth: 0, regexAllowed: true, parens: [], pendingControl: false }];
	let i = start;
	while (i < source.length) {
		const frame = frames[frames.length - 1];
		const char = source[i];
		const next = source[i + 1];
		if (frame.kind === "string") {
			if (char === "\\") i += 2;
			else if (char === frame.quote) { frames.pop(); i++; }
			else i++;
			continue;
		}
		if (frame.kind === "template") {
			if (char === "\\") i += 2;
			else if (char === "`") { frames.pop(); i++; }
			else if (char === "$" && next === "{") {
				frames.push({ kind: "code", interpolation: true, depth: 1, regexAllowed: true, parens: [], pendingControl: false });
				i += 2;
			} else i++;
			continue;
		}
		if (frame.kind === "lineComment") {
			if (char === "\r" || char === "\n") frames.pop();
			i++;
			continue;
		}
		if (frame.kind === "blockComment") {
			if (char === "*" && next === "/") { frames.pop(); i += 2; }
			else i++;
			continue;
		}
		if (frame.kind === "regex") {
			if (char === "\\") i += 2;
			else if (char === "[") { frame.characterClass = true; i++; }
			else if (char === "]") { frame.characterClass = false; i++; }
			else if (char === "/" && !frame.characterClass) {
				frames.pop();
				i++;
				while (/[a-z]/i.test(source[i] ?? "")) i++;
			} else i++;
			continue;
		}

		if (!frame.interpolation && char === "?" && next === ">") return i;
		if (/\s/.test(char)) { i++; continue; }
		if (char === "'" || char === '"') {
			frames.push({ kind: "string", quote: char });
			frame.regexAllowed = false;
			i++;
			continue;
		}
		if (char === "`") {
			frames.push({ kind: "template" });
			frame.regexAllowed = false;
			i++;
			continue;
		}
		if (char === "/" && next === "/") { frames.push({ kind: "lineComment" }); i += 2; continue; }
		if (char === "/" && next === "*") { frames.push({ kind: "blockComment" }); i += 2; continue; }
		if (char === "/" && frame.regexAllowed) {
			frames.push({ kind: "regex", characterClass: false });
			i++;
			continue;
		}
		if (/[a-z_$]/i.test(char)) {
			const word = /^[a-z_$][\w$]*/i.exec(source.slice(i))![0];
			frame.pendingControl = /^(if|while|for|with|switch|catch)$/.test(word) ||
				(frame.pendingControl && word === "await");
			frame.regexAllowed = /^(return|throw|case|delete|void|typeof|instanceof|in|of|yield|await|new|else|do)$/.test(word);
			i += word.length;
			continue;
		}
		if (/[0-9]/.test(char)) {
			const number = /^(?:0[xX][0-9a-fA-F]+|[0-9]+(?:\.[0-9]*)?)/.exec(source.slice(i))![0];
			frame.regexAllowed = false;
			frame.pendingControl = false;
			i += number.length;
			continue;
		}
		if (char === "(") {
			frame.parens.push(frame.pendingControl);
			frame.pendingControl = false;
			frame.regexAllowed = true;
			i++;
			continue;
		}
		if (char === ")") {
			frame.regexAllowed = frame.parens.pop() ?? false;
			frame.pendingControl = false;
			i++;
			continue;
		}
		frame.pendingControl = false;
		if (frame.interpolation && char === "{") frame.depth++;
		if (frame.interpolation && char === "}" && --frame.depth === 0) {
			frames.pop();
			i++;
			continue;
		}
		frame.regexAllowed = !/[)\]}]/.test(char);
		i++;
	}
	return -1;
}

/** Preserve executable JavaScript blocks and turn literal text into print calls. */
export function compileSource(source: string): string {
	const parts: string[] = [];
	let cursor = 0;
	while (cursor < source.length) {
		const open = source.indexOf("<?jst", cursor);
		if (open < 0) break;
		const markerEnd = open + 5;
		if (!/[\s=?-]/.test(source[markerEnd] ?? "")) {
			parts.push(`print(${JSON.stringify(source.slice(cursor, markerEnd))});`);
			cursor = markerEnd;
			continue;
		}
		if (open > cursor) parts.push(`print(${JSON.stringify(source.slice(cursor, open))});`);
		const mode = source[markerEnd] === "=" ? "escaped" : source[markerEnd] === "-" ? "raw" : "code";
		const codeStart = markerEnd + (mode === "code" ? 0 : 1);
		const close = findClose(source, codeStart);
		if (close < 0) throw new TemplateSyntaxError("Unclosed <?jst block", source, open);
		const code = source.slice(codeStart, close);
		if (mode === "code") parts.push(code);
		else if (!code.trim()) throw new TemplateSyntaxError("Empty output expression", source, open);
		else parts.push(`${mode === "escaped" ? "printEscaped" : "print"}(${code});`);
		cursor = close + 2;
	}
	if (cursor < source.length) parts.push(`print(${JSON.stringify(source.slice(cursor))});`);
	return `(async () => {\n${parts.join("\n")}\n})()`;
}
