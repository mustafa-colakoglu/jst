import fs from "fs";
import { Request, Response } from "express";
import generateCode from "./generateCode";
import executeCode from "./executeCode";
import splitDots from "./splitDots";

const resolvePage = async (
	page: string,
	req: Request,
	res: Response,
	justReturn: boolean = false,
	data: any,
) => {
	page = splitDots(page);
	const obj = {
		args: [],
		output: "",
		console,
		POST: req.body,
		GET: req.query,
		HEADERS: req.headers,
		...data,
		require: (moduleName = "", partialData = {}) => {
			if (moduleName.startsWith(".")) {
				if (moduleName.endsWith(".jst")) {
					return new Promise(async (r) => {
						const requireResolve = await resolvePage(
							moduleName.substr(0, moduleName.length - 4),
							req,
							res,
							true,
							partialData,
						);
						addToOutput(requireResolve);
						r("Done");
					});
				} else {
					return require(`${__dirname}/../${moduleName}`);
				}
			} else if (!moduleName.startsWith(".")) {
				return require(moduleName);
			}
		},
	};
	const addToOutput = (add = "") => (obj.output += add);
	try {
		if (fs.existsSync(`${__dirname}/../www/${page}.jst`)) {
			const fileContents = fs.readFileSync(
				`${__dirname}/../www/${page}.jst`,
				"utf8",
			);
			const code = generateCode(obj, fileContents);
			await executeCode(obj, code);
			if (justReturn) return obj.output;
			res.send(obj.output);
		} else {
			if (justReturn) return `${page}.jst not found on this server`;
			res.statusCode = 404;
			res.send(`${page}.jst not found on this server`);
		}
	} catch (err: any) {
		let returnError = "";
		if (process.env.NODE_ENV !== "production") {
			returnError = err.toString() + " : <br />";
			const splitError = err.stack.split("evalmachine.<anonymous>:")[1];
			let upLen = 0;
			let finded = false;
			for (let i = splitError.length; i > -1; i--) {
				if (!finded && splitError.substr(i, 1) == "^") {
					finded = true;
					upLen++;
				} else if (finded && splitError.substr(i, 1) === "^") upLen++;
				else if (finded && splitError.substr(i, 1) === " ") break;
			}
			let up = "";
			for (let i = 0; i < upLen; i++) {
				up += "^";
			}
			let splitUp = splitError.substr(1, splitError.length).split(up);
			const splitN = splitUp[0].split("\n");
			const showErrorLine = splitN[splitN.length - 1];
			let codeLine = "";
			for (let i = 0; i < splitN.length - 1; i++) {
				codeLine += splitN[i];
			}
			let whiteSpaceLen = 0;
			for (let i = 0; i < showErrorLine.length; i++) {
				if (showErrorLine.substr(i, 1) === " ") {
					whiteSpaceLen++;
				}
			}
			let errorCodeString = "";
			for (let i = 0; i < codeLine.length; i++) {
				if (i < whiteSpaceLen) errorCodeString += codeLine.substr(i, 1);
				else if (i === whiteSpaceLen)
					errorCodeString += `<span style="color:red; font-weight:bold">${codeLine.substr(
						i,
						1,
					)}`;
				else if (i < codeLine.length - 1)
					errorCodeString += codeLine.substr(i, 1);
				else errorCodeString += `${codeLine.substr(i, 1)}</span>`;
			}
			returnError += errorCodeString;
		}
		if (justReturn) return returnError;
		res.header("Content-Type", "text/html");
		res.statusCode = 500;
		res.send(returnError);
	}
};
export default resolvePage;
