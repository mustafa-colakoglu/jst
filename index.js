const express = require("express");
const bodyParser = require("body-parser");
const multer = require("multer");
const fs = require("fs");
const resolvePage = require("./system/resolvePage");
const splitDots = require("./system/splitDots");
const app = express();
app.use(express.json());
app.use(bodyParser.urlencoded({ extended: true }));
const upload = multer();
app.use(upload.array());
app.listen(process.env.PORT || 80);
app.get("/:page.jst", async (req, res) => {
  const page = splitDots(req.params.page);
  resolvePage(page, req, res);
});
app.post("/:page.jst", async (req, res) => {
  const page = splitDots(req.params.page);
  resolvePage(page, req, res);
});
app.get("/", async (req, res) => {
  resolvePage("index", req, res);
});
app.post("/", async (req, res) => {
  resolvePage("index", req, res);
});
app.get("/*", async (req, res) => {
  const originalUrl = splitDots(req.originalUrl);
  if (req.path.endsWith(".jst")) {
    resolvePage(originalUrl.substr(1, originalUrl.length), req, res);
  } else if (fs.existsSync(`./www${originalUrl}`)) {
    res.sendFile(`${__dirname}/www${originalUrl}`);
  } else {
    res.statusCode = 404;
    res.send(`${originalUrl} not found on this server`);
  }
});
app.post("/*", async (req, res) => {
  const originalUrl = splitDots(req.originalUrl);
  if (req.path.endsWith(".jst")) {
    resolvePage(originalUrl.substr(1, originalUrl.length - 5), req, res);
  } else if (fs.existsSync(`./www${originalUrl}`)) {
    res.sendFile(`${__dirname}/www${originalUrl}`);
  } else {
    res.statusCode = 404;
    res.send(`${originalUrl} not found on this server`);
  }
});
