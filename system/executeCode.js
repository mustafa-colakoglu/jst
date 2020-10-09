const executeCode = async (vm, obj, code, page) => {
  const context = vm.createContext(obj);
  const script = new vm.Script(code, {filename:`${page}.jst`});
  await script.runInContext(context, {
    lineOffset: 0,
    displayErrors: true,
  });
};
module.exports = executeCode;
