import vm from "vm";

const executeCode = async (obj: any, code: string) => {
	const context = vm.createContext(obj);
	const script = new vm.Script(code);
	await script.runInContext(context, {
		lineOffset: 0,
		displayErrors: true,
	});
};
export default executeCode;
