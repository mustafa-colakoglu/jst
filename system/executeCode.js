const executeCode = async (vm, obj, code) => {
  const context = vm.createContext(obj);
  const script = new vm.Script(code);
  await script.runInContext(context, {
    lineOffset: 0,
    displayErrors: true,
  });
};
module.exports = executeCode;
