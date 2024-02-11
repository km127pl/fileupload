import http from "node:http";
import { readFile, stat, mkdir } from "node:fs/promises";
import { createWriteStream } from "node:fs";

// we want this to be dependency free
import { fromMime, mimeFor } from "./mime.js";
import { config } from "./config.js";

const routes = {
	/**
	 * Homepage
	 * @method GET
	 * @route /
	 */
	"^/$": async (req, res) => {
		res.writeHead(200, { "Content-Type": "text/html" });
		res.end(await readFile("./public/index.html"));
	},
	/**
	 * File download page
	 * @method GET
	 * @route /d/
	 * @param {String} id
	 * @param {String} file
	 */
	"^/d/(.*)/(.*)$": async (req, res, id, file) => {
		try {
			await stat(`./${config.upload.directory}/${id}/${file}`);
		} catch (e) {
			// file does not exist
			res.writeHead(302, {
				Location: "/",
			});
			res.end();
			return;
		}

		// read file
		const f = await readFile(`./${config.upload.directory}/${id}/${file}`);

		// send file
		res.writeHead(200, {
			"Content-Type": mimeFor(file),
		});
		res.end(f);
	},
	/**
	 * File info page
	 * @method GET
	 * @route /i/
	 * @param {String} id
	 * @param {String} file
	 * @returns JSON
	 */
	"^/i/(.*)/(.*)$": async (req, res, id, file) => {
		try {
			const info = await stat(
				`./${config.upload.directory}/${id}/${file}`
			);
			res.writeHead(200, { "Content-Type": "application/json" });
			res.end(
				JSON.stringify({
					status: "ok",
					file: file,
					id: id,
					size: info.size,
					created: info.birthtime,
					type: mimeFor(file),
				})
			);
		} catch (e) {
			// file does not exist
			res.writeHead(404);
			res.end(
				JSON.stringify({
					status: "error",
					description: "File not found",
				})
			);
			return;
		}
	},
	/**
	 * Uploaded - shows a confirmation that the file has been uploaded
	 * @method GET
	 * @route /uploaded
	 * @query id - the file id (a 12 char id)
	 * @query file - the file (e.g. file.txt)
	 */
	"^\\/uploaded\\?id=(.*)&file=(.*)$": async (req, res, id, file) => {
		res.writeHead(200, { "Content-Type": "text/html" });
		const page = (await readFile("./public/uploaded.html", "utf-8"))
			.toString()
			.replaceAll("{{ url }}", `${req.headers.referer}d/${id}/${file}`)
			.replaceAll("{{ filename }}", `${file}`);
		res.end(page);
	},
	/**
	 * A route to upload files
	 * @method POST
	 * @route /upload
	 */
	"^/upload$": async (req, res) => {
		if (req.method != "POST") {
			res.writeHead(405);
			res.end("Error: Method not allowed, this route only accepts POST");
			return;
		}
		res.setHeader("Content-Type", "application/json");

		let len = parseInt(req.headers["content-length"]);
		if (isNaN(len) || len <= 0 || len > config.upload.maxSize) {
			// 1GB
			res.statusCode = 411;
			res.end();
			return;
		}

		const id = genToken(config.privacy.idLength);
		mkdir(`./${config.upload.directory}/${id}`);

		// original filename
		let name = req.headers["filename"];
		if (name == null) {
			name = `${genToken(6)}.${fromMime(req.headers["content-type"])}`;
		}

		// create a write stream
		const ws = createWriteStream(
			`./${config.upload.directory}/${id}/${name}`
		);

		ws.on("error", (error) => {
			console.error(error);
			res.statusCode = 400;
			res.write(JSON.stringify({ status: "error", description: error }));
			res.end();
		});

		// pipe the request to the write stream
		req.pipe(ws);

		req.on("end", () => {
			ws.close(() => {
				res.end(
					JSON.stringify({
						file: name,
						id: id,
					})
				);
			});
		});
	},
};

const handler = async (req, res) => {
	const route = Object.keys(routes).filter((route) =>
		req.url.match(route)
	)[0];

	if (!route) {
		res.writeHead(404, { "Content-Type": "text/html" });
		res.end(await readFile("./public/error.html"));
		return;
	}

	const params = req.url.match(route);
	return routes[route](req, res, ...params.slice(1));
};

/**
 * Creates a random token of n length
 * @param {*} length length of the token
 * @see https://stackoverflow.com/questions/1349404/generate-random-string-characters-in-javascript
 * @returns the random token
 */
const genToken = (length) => {
	let result = "";
	const characters =
		"ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
	const charactersLength = characters.length;
	let counter = 0;

	while (counter < length) {
		result += characters.charAt(
			Math.floor(Math.random() * charactersLength)
		);
		counter += 1;
	}

	return result;
};

http.createServer(handler).listen(config.webserver.port, () => {
	console.log(
		`[!] Server running at http://localhost:${config.webserver.port}/`
	);
});
