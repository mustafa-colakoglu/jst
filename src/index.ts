import express, { Request, Response } from "express";
import bodyParser from "body-parser";
import fs from "fs";
import resolvePage from "./system/resolvePage";
import splitDots from "./system/splitDots";
const app = express();
app.use(express.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.listen(process.env.PORT || 80, () => {
	console.log("Server is running on port 80");
});
app.get("/:page.jst", async (req: Request, res: Response) => {
	const page = splitDots(req.params.page);
	resolvePage(page, req, res, false, {});
});
app.post("/:page.jst", async (req: Request, res: Response) => {
	const page = splitDots(req.params.page);
	resolvePage(page, req, res, false, {});
});
app.get("/", async (req: Request, res: Response) => {
	resolvePage("index", req, res, false, {});
});
app.post("/", async (req: Request, res: Response) => {
	resolvePage("index", req, res, false, {});
});
app.get("/*", async (req: Request, res: Response) => {
	const originalUrl = splitDots(req.originalUrl);
	if (req.path.endsWith(".jst")) {
		resolvePage(
			originalUrl.substr(1, originalUrl.length),
			req,
			res,
			false,
			{},
		);
	} else if (fs.existsSync(`${__dirname}/www${originalUrl}`)) {
		res.sendFile(`${__dirname}/www${originalUrl}`);
	} else {
		res.statusCode = 404;
		res.send(`${originalUrl} not found on this server`);
	}
});
app.post("/*", async (req: Request, res: Response) => {
	const originalUrl = splitDots(req.originalUrl);
	if (req.path.endsWith(".jst")) {
		resolvePage(
			originalUrl.substr(1, originalUrl.length - 5),
			req,
			res,
			false,
			{},
		);
	} else if (fs.existsSync(`${__dirname}/www${originalUrl}`)) {
		res.sendFile(`${__dirname}/www${originalUrl}`);
	} else {
		res.statusCode = 404;
		res.send(`${originalUrl} not found on this server`);
	}
});
