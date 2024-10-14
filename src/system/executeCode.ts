const executeCode = async (vm: any, obj: any, code: string) => {
	const context = vm.createContext(obj);
	const script = new vm.Script(code);
	await script.runInContext(context, {
		lineOffset: 0,
		displayErrors: true,
	});
};
export default executeCode;
