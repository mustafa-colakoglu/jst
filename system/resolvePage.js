const fs = require("fs");
const util = require("util");
const readFile = util.promisify(fs.readFile);
const generateCode = require("./generateCode");
const executeCode = require("./executeCode");
const splitDots = require("./splitDots");
const resolvePage = async (page, req, res, justReturn = false) => {
  page = splitDots(page);
  try {
    if (fs.existsSync(`${__dirname}/../www/${page}.jst`)) {
      const fileContents = await (
        await readFile(`${__dirname}/../www/${page}.jst`)
      ).toString();
      let output = "";
      const print = (text) => {
        output += text;
      };
      const obj = {
        args: [],
        output: "",
        console,
        print,
        POST: req.body,
        GET: req.query,
        HEADERS: req.headers,
        require: (moduleName = "") => {
          if (moduleName.startsWith(".")) {
            if (moduleName.endsWith(".jst")) {
              return new Promise(async (r) => {
                const requireResolve = await resolvePage(
                  moduleName.substr(0, moduleName.length - 4),
                  req,
                  res,
                  true
                );
                output += requireResolve;
                r();
              });
            } else {
              return require(`${__dirname}/../${moduleName}`);
            }
          } else if (!moduleName.startsWith(".")) {
            return require(moduleName);
          }
        },
      };
      const code = await generateCode(obj, fileContents);
      await executeCode(obj, code);
      if (justReturn) return output;
      res.send(output);
    } else {
      if (justReturn) return `${page}.jst not found on this server`;
      res.statusCode = 404;
      res.send(`${page}.jst not found on this server`);
    }
  } catch (err) {
    if (justReturn) return err.toString();
    res.statusCode = 500;
    res.send(err.toString());
  }
};
module.exports = resolvePage;
