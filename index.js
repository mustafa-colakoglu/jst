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
const resolve = async (page, req, res) => {
  if (fs.existsSync(`./www/${page}.jst`)) {
    const index = await (await readFile(`./www/${page}.jst`)).toString();
    const split = index.split("?>");
    let output = "";
    const print = (text) => {
      output += text;
    };
    const obj = {
      output: "",
      print,
      POST: req.body,
      GET: req.query,
      setTimeout,
      mysql,
    };
    vm.createContext(obj);
    for (let i = 0; i < split.length; i++) {
      let temp = split[i];
      const split2 = temp.split("<?jst");
      output += split2[0];
      if (split2.length === 2) {
        const temp2 = split2[1].trim();
        await vm.runInContext(temp2, obj);
      }
    }
    res.send(output);
  } else {
    res.statusCode = 404;
    res.send("Not found on this server");
  }
};
