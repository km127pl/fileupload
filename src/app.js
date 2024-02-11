import { readFile, stat, mkdir, writeFile } from 'node:fs/promises';
import { Stream } from 'node:stream';

// we want this to be dependency free
import { fromMime, mimeFor } from './mime.js';
import { encrypt, decrypt } from './encryption.js';

const {
	WEB_PORT,
	APP_DOMAIN,
	ENCRYPTION_ENABLED,
	SSL_KEY,
	SSL_CERT,
	SSL_ENABLED,
	UPLOAD_DIRECTORY,
	UPLOAD_MAX_SIZE,
	UPLOAD_ID_LEN,
} = process.env;

const routes = {
	/**
	 * Homepage
	 * @method GET
	 * @route /
	 */
	'^/$': async (req, res) => {
		res.writeHead(200, { 'Content-Type': 'text/html' });
		res.end(await readFile('./public/index.html'));
	},
	/**
	 * File download page
	 * @method GET
	 * @route /d/
	 * @param {String} id
	 * @param {String} file
	 */
	'^/d/(.*)/(.*)$': async (req, res, id, file) => {
		if (id.length < 1 || file.length === 0) {
			res.writeHead(404, { 'Content-Type': 'text/html' });
			res.end(await readFile('./public/error.html'));
			return;
		}
		try {
			await stat(`./${UPLOAD_DIRECTORY}/${id}/${file}`);
		} catch (e) {
			// file does not exist
			res.writeHead(302, {
				Location: '/',
			});
			res.end();
			return;
		}

		// read file
		const f = await readFile(`./${UPLOAD_DIRECTORY}/${id}/${file}`);

		// decrypt if necessary
		if (ENCRYPTION_ENABLED) {
			const decrypted = decrypt(f.toString());
			res.writeHead(200, {
				'Content-Type': mimeFor(file),
			});
			res.end(decrypted);
			return;
		}

		// send file
		res.writeHead(200, {
			'Content-Type': mimeFor(file),
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
	'^/i/(.*)/(.*)$': async (req, res, id, file) => {
		try {
			const info = await stat(`./${UPLOAD_DIRECTORY}/${id}/${file}`);
			res.writeHead(200, { 'Content-Type': 'application/json' });
			res.end(
				JSON.stringify({
					status: 'ok',
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
					status: 'error',
					description: 'File not found',
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
	'^\\/uploaded\\?id=(.*)&file=(.*)$': async (req, res, id, file) => {
		res.writeHead(200, { 'Content-Type': 'text/html' });
		const page = (await readFile('./public/uploaded.html', 'utf-8'))
			.toString()
			.replaceAll('{{ url }}', `${req.headers.referer}d/${id}/${file}`)
			.replaceAll('{{ filename }}', `${file}`);
		res.end(page);
	},
	/**
	 * A route to upload files
	 * @method POST
	 * @route /upload
	 */
	'^/upload$': async (req, res) => {
		if (req.method != 'POST') {
			res.writeHead(405);
			res.end('Error: Method not allowed, this route only accepts POST');
			return;
		}
		res.setHeader('Content-Type', 'application/json');

		let len = parseInt(req.headers['content-length']);
		if (isNaN(len) || len <= 0) {
			res.statusCode = 411;
			res.end(
				JSON.stringify({
					status: 411,
					message: 'LENGTH_REQUIRED',
				})
			);
			return;
		}

		if (len > UPLOAD_MAX_SIZE) {
			res.statusCode = 413;
			res.end(
				JSON.stringify({
					status: 413,
					message: 'REQUEST_TOO_LARGE',
				})
			);
			return;
		}

		const id = genToken(UPLOAD_ID_LEN ?? 12);
		mkdir(`./${UPLOAD_DIRECTORY}/${id}`);

		// original filename
		let name = encodeURIComponent(req.headers['filename']);
		if (name == null) {
			name = `${genToken(6)}.${fromMime(req.headers['content-type'])}`;
		}

		// create a write stream
		// const ws = createWriteStream(
		// 	`./${UPLOAD_DIRECTORY}/${id}/${name}`
		// );
		// create a temporary stream
		const ws = new Stream.Writable({
			objectMode: true,
			write(chunk, encoding, callback) {
				// Store the chunk of data in an array
				this.data.push(chunk);
				callback();
			},
		});

		ws.data = [];
		ws.close = (callback) => {
			const data = Buffer.concat(ws.data);
			callback(data);
		};

		ws.on('error', (error) => {
			console.error(error);
			res.statusCode = 400;
			res.write(JSON.stringify({ status: 'error', description: error }));
			res.end();
		});

		// pipe the request to the write stream
		req.pipe(ws);

		req.on('end', () => {
			ws.close((buf) => {
				if (ENCRYPTION_ENABLED) {
					// encrypt the file
					const encrypted = encrypt(buf);

					// write the encrypted file
					writeFile(`./${UPLOAD_DIRECTORY}/${id}/${name}`, encrypted);
				} else {
					// write the file
					writeFile(`./${UPLOAD_DIRECTORY}/${id}/${name}`, buf);
				}
				res.end(
					JSON.stringify({
						file: name,
						id: id,
					})
				);
			});
		});
	},
	/**
	 * The favicon
	 * @method GET
	 * @route /favicon.svg
	 */
	/**
	 * Homepage
	 * @method GET
	 * @route /
	 */
	'^/favicon.svg$': async (req, res) => {
		res.writeHead(200, { 'Content-Type': mimeFor('.svg') });
		res.end(await readFile('./public/favicon.svg'));
	},
};

const handler = async (req, res) => {
	const route = Object.keys(routes).filter((route) =>
		req.url.match(route)
	)[0];

	if (!route) {
		res.writeHead(404, { 'Content-Type': 'text/html' });
		res.end(await readFile('./public/error.html'));
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
	let result = '';
	const characters =
		'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
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

let server = await import('node:http');
let opts = {};

if (SSL_ENABLED) {
	try {
		server = await import('node:https');
		opts['key'] = await readFile(SSL_KEY, 'utf-8');
		opts['cert'] = await readFile(SSL_CERT, 'utf-8');
	} catch (err) {
		console.error('[!] Error: HTTPS support is not available.');
	}
}

server.createServer(opts, handler).listen(WEB_PORT, () => {
	console.log(
		`[!] Server running at ${SSL_ENABLED ? 'https' : 'http'}://${APP_DOMAIN ?? 'localhost'}:${WEB_PORT}/`
	);
});
