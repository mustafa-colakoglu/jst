const generateCode = (obj: any, fileContents = "") => {
	let script = "";
	let lastIndex = 0;
	const regex =
		/<\?jst((?:(?!<\?jst|\?>)[^"'`/]|"(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'|`(?:\\.|[^`\\])*`|\/\/.*?(?:\r?\n|$)|\/\*[\s\S]*?\*\/)*)\?>/g;
	let match;

	while ((match = regex.exec(fileContents)) !== null) {
		if (match.index > lastIndex) {
			const htmlContent = fileContents.slice(lastIndex, match.index);
			obj.args.push(htmlContent);
			script += `print(args[${obj.args.length - 1}]);`;
		}
		script += match[1];

		lastIndex = regex.lastIndex;
	}
	if (lastIndex < fileContents.length) {
		const remainingHtml = fileContents.slice(lastIndex);
		obj.args.push(remainingHtml);
		script += `print(args[${obj.args.length - 1}]);`;
	}

	script = `(async () => {
    const print = (text) => {
      output += text;
    };
    ${script}
  })()`;
	return script;
};

export default generateCode;
