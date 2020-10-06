const express = require("express");
const bodyParser = require("body-parser");
const multer = require("multer");
const fs = require("fs");
const util = require("util");
const readFile = util.promisify(fs.readFile);
const vm = require("vm");
const mysql = require("./services/mysql");
const app = express();
app.use(express.json());
app.use(bodyParser.urlencoded({ extended: true }));
const upload = multer();
app.use(upload.array());
app.listen(process.env.PORT || 80);
app.get("/:page.jst", async (req, res) => {
  resolve(req.params.page, req, res);
});
app.get("/", async (req, res) => {
  resolve("index", req, res);
});
app.get("/*", async (req, res) => {
  if (req.path.endsWith(".jst")) {
    resolve(req.originalUrl.substr(1, req.originalUrl.length), req, res);
  } else if (fs.existsSync(`./www${req.originalUrl}`)) {
    res.sendFile(`${__dirname}/www${req.originalUrl}`);
  } else {
    res.statusCode = 404;
    res.send("Not found on this server");
  }
});
app.post("/*", async (req, res) => {
  if (req.path.endsWith(".jst")) {
    resolve(req.originalUrl.substr(1, req.originalUrl.length - 5), req, res);
  } else if (fs.existsSync(`./www${req.originalUrl}`)) {
    res.sendFile(`${__dirname}/www${req.originalUrl}`);
  } else {
    res.statusCode = 404;
    res.send("Not found on this server");
  }
});
const resolve = async (page, req, res, justReturn = false) => {
  try {
    if (fs.existsSync(`./www/${page}.jst`)) {
      const fileContents = await (
        await readFile(`./www/${page}.jst`)
      ).toString();
      let output = "";
      const print = (text) => {
        output += text;
      };
      const obj = {
        args: [],
        output: "",
        print,
        POST: req.body,
        GET: req.query,
        HEADERS: req.headers,
        setTimeout,
        mysql,
        require: async (moduleName = "") => {
          if (moduleName.startsWith(".") && !moduleName.startsWith("..")) {
            if (moduleName.endsWith(".jst")) {
              const t = Date.now();
              const requireResolve = await resolve(
                moduleName.substr(0, moduleName.length - 4),
                req,
                res,
                true
              );
              output += requireResolve;
            } else {
              return require(moduleName);
            }
          } else if (!moduleName.startsWith(".")) {
            return require(moduleName);
          }
        },
      };
      const code = await generateCode(obj, fileContents);
      //   console.log(code);
      await executeCodes(obj, code);
      if (justReturn) return output;
      res.send(output);
    } else {
      if (justReturn) return "Not found on this server";
      res.statusCode = 404;
      res.send("Not found on this server");
    }
  } catch (err) {
    if (justReturn) return err.toString();
    res.statusCode = 500;
    res.send(err.toString());
  }
};
const generateCode = async (obj, fileContents = "") => {
  const split = fileContents.split("?>");
  let script = "";
  for (let i = 0; i < split.length; i++) {
    let temp = split[i];
    const split2 = temp.split("<?jst");
    obj.args.push(split2[0].trim());
    script += `print(args[${obj.args.length - 1}])`;
    if (split2.length === 2) {
      script += split2[1];
    }
  }
  script = `(async () => {
        ${script}
    })()`;
  return script;
};
const executeCodes = async (obj, script) => {
  vm.createContext(obj);
  await vm.runInContext(script, obj);
};
