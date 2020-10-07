const vm = require("vm");
const executeCode = async (obj, script) => {
  vm.createContext(obj);
  await vm.runInContext(script, obj);
};
module.exports = executeCode;
