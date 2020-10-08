const executeCode = async (vm, obj, code) => {
  const context = vm.createContext(obj);
  const script = new vm.Script(code);
  await script.runInContext(context, {
    lineOffset: 0,
    displayErrors: true,
  });
  // await vm.runInContext(script, obj);
};
module.exports = executeCode;
