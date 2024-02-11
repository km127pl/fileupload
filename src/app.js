import http from "node:http";
import { readFile, stat, writeFile, mkdir } from "node:fs/promises";

// we want this to be dependency free
import { mimeFor, mimeTypes } from "./mime.js";

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
			await stat(`./uploads/${id}/${file}`);
		} catch (e) {
			// file does not exist
			res.writeHead(302, {
				Location: "/",
			});
			res.end();
			return;
		}

		// read file
		console.log(`./uploads/${id}/${file}`);
		const f = await readFile(`./uploads/${id}/${file}`);

		// send file
		res.writeHead(200, {
			"Content-Type": mimeFor(file),
		});
		res.end(f);
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
			.replaceAll(
				"{{ url }}",
				`https://${req.headers.host}/d/${id}/${file}`
			);
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

		let dataBuffer = Buffer.alloc(0);

		req.on("data", (chunk) => {
			dataBuffer = Buffer.concat([dataBuffer, chunk]);
		});

		req.on("end", async () => {
			try {
				// 1:30 AM: black box don't touch
				const data = dataBuffer.toString();
				const boundary = req.headers["content-type"].split("=")[1];
				const parts = data.split(boundary).slice(1, -1);
				const files = parts.map((part) => {
					const match = part.match(/filename="(.*)"/);
					const name = match ? match[1] : null;
					const match2 = part.match(/\r\n\r\n([\s\S]*)/);
					const body = match2 ? match2[1] : null;
					if (!name || !body) return null;
					return { name, body };
				});

				const id = genToken(12);
				let fileName;
				// get a list of files to upload
				//@TODO: bulk file upload from frontend
				for (const file of files) {
					if (file == undefined) {
						res.writeHead(302, {
							Location: "/",
						});
					}
					await mkdir(`./uploads/${id}`).then((err) => {
						if (err) {
							//@TODO: better error handling
							console.error(err);
							res.end("Error whilst uploading");
							return;
						}
					});
					await writeFile(`./uploads/${id}/${file.name}`, file.body);
					fileName = file.name;
				}

				res.writeHead(302, {
					Location: `/uploaded?id=${id}&file=${fileName}`,
				});
				res.end("Files uploaded");
			} catch (e) {
				//@TODO: better error handling
				console.error(e);
				res.end(e.message);
			}
		});
	},
	/**
	 * A route to get files from uploads folder
	 * @method GET
	 * @route /file/{id}/{file}
	 * @param {String} id
	 * @param {String} file
	 */
	"^/file/(.*)/(.*)": async (req, res, id, file) => {
		res.writeHead(200);
		res.end(`${id} ${file}`);
	},
};

const handler = async (req, res) => {
	console.log(req.url);
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

http.createServer(handler).listen(8080);
