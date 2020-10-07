const express = require("express");
const bodyParser = require("body-parser");
const multer = require("multer");
const fs = require("fs");
const resolvePage = require("./system/resolvePage");
const app = express();
app.use(express.json());
app.use(bodyParser.urlencoded({ extended: true }));
const upload = multer();
app.use(upload.array());
app.listen(process.env.PORT || 80);
app.get("/:page.jst", async (req, res) => {
  resolvePage(req.params.page, req, res);
});
app.get("/", async (req, res) => {
  resolvePage("index", req, res);
});
app.get("/*", async (req, res) => {
  if (req.path.endsWith(".jst")) {
    resolvePage(req.originalUrl.substr(1, req.originalUrl.length), req, res);
  } else if (fs.existsSync(`./www${req.originalUrl}`)) {
    res.sendFile(`${__dirname}/www${req.originalUrl}`);
  } else {
    res.statusCode = 404;
    res.send("Not found on this server");
  }
});
app.post("/*", async (req, res) => {
  if (req.path.endsWith(".jst")) {
    resolvePage(
      req.originalUrl.substr(1, req.originalUrl.length - 5),
      req,
      res
    );
  } else if (fs.existsSync(`./www${req.originalUrl}`)) {
    res.sendFile(`${__dirname}/www${req.originalUrl}`);
  } else {
    res.statusCode = 404;
    res.send("Not found on this server");
  }
});
