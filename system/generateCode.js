const generateCode = async (obj, fileContents = "") => {
  const split = fileContents.split("?>");
  let script = "";
  for (let i = 0; i < split.length; i++) {
    let temp = split[i];
    const split2 = temp.split("<?jst");
    obj.args.push(split2[0]);
    script += `print(args[${obj.args.length - 1}]);`;
    if (split2.length === 2) {
      script += split2[1];
    }
  }
  script = `(async () => {
            ${script}
        })()`;
  return script;
};
module.exports = generateCode;
