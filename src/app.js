import { readFile, stat, mkdir, writeFile } from 'node:fs/promises';
import { Stream } from 'node:stream';

import { createPreview, fromMime, mimeFor } from './mime.js';
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
	CACHE_ENABLED,
	WEB_USE_HTTP2,
} = process.env;

const pages = {};

/**
 * Get an asset from the fs
 * @param {*} assetName the asset
 * @description this function will get an asset from the fs and cache it if necessary
 * @returns the asset
 */
const getAsset = async (assetName) => {
	if (pages[assetName]) {
		return pages[assetName];
	}
	try {
		let asset = await readFile(`./public/${assetName}`, 'utf-8');
		if (CACHE_ENABLED === 'true') {
			pages[assetName] = asset;
		}
		return asset;
	} catch (e) {
		console.error("Error: couldn't read asset", assetName);
		return null;
	}
};

const routes = {
	/**
	 * Homepage
	 * @method GET
	 * @route /
	 */
	'^/$': async (req, res) => {
		res.writeHead(200, { 'Content-Type': 'text/html' });
		const page = (await getAsset('index.html'))
			.toString()
			.replaceAll(
				'{{ max_file_size_pretty }}',
				`${prettifySize(parseInt(UPLOAD_MAX_SIZE))}`
			)
			.replaceAll('MAX_FILE_SIZE', `${UPLOAD_MAX_SIZE}`);
		res.end(page);
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
			res.end(await getAsset('error.html'));
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
		if (ENCRYPTION_ENABLED === 'true') {
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
	 * File preview page
	 * @method GET
	 * @route /v/
	 * @param {String} id
	 * @param {String} file
	 */
	'^/v/(.*)/(.*)$': async (req, res, id, file) => {
		if (id.length < 1 || file.length === 0) {
			res.writeHead(404, { 'Content-Type': 'text/html' });
			res.end(await getAsset('error.html'));
			return;
		}
		try {
			const info = await stat(`./${UPLOAD_DIRECTORY}/${id}/${file}`);

			let filename = file;
			if (file.length > 32 && file.split('.').length > 4) {
				// truncate the filename (fileasdasd...txt)
				filename = `${file.substring(0, 32)}...${file.split('.').pop()}`;
			}

			let preview = await readFile(`./${UPLOAD_DIRECTORY}/${id}/${file}`);

			// decrypt
			if (ENCRYPTION_ENABLED === 'true') {
				const decrypted = decrypt(preview.toString());
				preview = decrypted;
			}

			const previewPage = createPreview(file, preview);

			const page = (await getAsset('preview.html'))
				.toString()
				.replaceAll(
					'{{ url }}',
					`${SSL_ENABLED === 'true' ? 'https' : 'http'}://${APP_DOMAIN ?? 'localhost'}/d/${id}/${file}`
				)
				.replaceAll('{{ filename }}', `${filename}`)
				.replaceAll('{{ size }}', `${info.size}`)
				.replaceAll('{{ size_pretty }}', `${prettifySize(info.size)}`)
				.replaceAll('{{ preview }}', previewPage);
			res.writeHead(200, { 'Content-Type': 'text/html' });
			res.end(page);
		} catch (e) {
			// file does not exist
			console.error(e);
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
		const page = (await getAsset('uploaded.html'))
			.toString()
			.replaceAll('{{ url }}', `${req.headers.referer}d/${id}/${file}`)
			.replaceAll('{{ filename }}', `${file}`)
			.replaceAll(
				'{{ preview_url }}',
				`${req.headers.referer}v/${id}/${file}`
			);
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

		let formfile = false;

		const id = genToken(UPLOAD_ID_LEN ?? 12);
		mkdir(`./${UPLOAD_DIRECTORY}/${id}`);

		// original filename
		let name = encodeURIComponent(req.headers['filename']);
		if (name == null) {
			name = `${genToken(6)}.${fromMime(req.headers['content-type'])}`;
		}

		if (
			req.headers['content-type'] &&
			req.headers['content-type'].includes('multipart/form-data')
		) {
			formfile = true && process.env.FORMFILE_SUPPORT === 'true';
		}

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
				if (formfile) {
					let header = buf
						.toString()
						.split('\r\n')
						.slice(0, 8)
						.join('\r\n');
					let filename = header.match(/filename="(.+)"/)[0];
					name = filename.split('"')[1];

					buf = buf.slice(header.length);
					buf = buf.slice(0, buf.length - 41);
					buf = buf.slice(2, buf.length - 2);
				}
				if (ENCRYPTION_ENABLED === 'true') {
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
	'^/favicon.svg$': async (req, res) => {
		res.writeHead(200, { 'Content-Type': mimeFor('.svg') });
		res.end(await getAsset('favicon.svg'));
	},
	/**
	 * The favicon
	 * @method GET
	 * @route /favicon.svg
	 */
	'^/main.css$': async (req, res) => {
		res.writeHead(200, { 'Content-Type': mimeFor('.css') });
		res.end(await getAsset('main.css'));
	},
};

const handler = async (req, res) => {
	console.log(`[!] ${req.method} ${req.url}`);

	const route = Object.keys(routes).filter((route) =>
		req.url.match(route)
	)[0];

	if (!route) {
		res.writeHead(404, { 'Content-Type': 'text/html' });
		res.end(await getAsset('error.html'));
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

/**
 * Get a uri based on the routes and the app configuration
 * @param  {...any} routes the routes
 * @returns the uri
 */
const uri = (...routes) => {
	return `${SSL_ENABLED === 'true' ? 'https' : 'http'}://${APP_DOMAIN ?? 'localhost'}:${routes.join('/')}`;
};

/**
 * Prettify a size
 * @param {*} size the size
 * @returns the pretty size
 * @example
 * prettifySize(1024) // 1 KB
 * prettifySize(1024 * 1024) // 1 MB
 */
const prettifySize = (size) => {
	const units = ['B', 'KiB', 'MiB', 'GiB', 'TiB'];
	let counter = 0;
	while (size >= 1024) {
		size /= 1024;
		counter += 1;
	}
	const fixedPoints = size <= 10 ? 2 : 0;
	return `${size.toFixed(fixedPoints).split('.00').join('')} ${units[counter]}`;
};

let createServer =
	WEB_USE_HTTP2 === 'true'
		? (await import('node:http2')).createServer
		: (await import('node:http')).createServer;
let opts = {};

if (SSL_ENABLED === 'true') {
	try {
		createServer = (await import('node:http2')).createSecureServer;
		opts['key'] = await readFile(SSL_KEY, 'utf-8');
		opts['cert'] = await readFile(SSL_CERT, 'utf-8');
	} catch (err) {
		console.error('[!] Error: HTTPS support is not available.');
	}
}

createServer(opts, handler).listen(WEB_PORT, () => {
	console.log(
		`[!] Server running at ${SSL_ENABLED === 'true' ? 'https' : 'http'}://${APP_DOMAIN ?? 'localhost'}:${WEB_PORT}/`
	);

	// print configuration info
	console.log(`[!] Configuration`);
	console.log(`\t- SSL_ENABLED: ${SSL_ENABLED}`);
	console.log(`\t- APP_DOMAIN: ${APP_DOMAIN}`);
	console.log(`\t- WEB_USE_HTTP2: ${WEB_USE_HTTP2}`);
	console.log(`\t- UPLOAD_DIRECTORY: ${UPLOAD_DIRECTORY}`);
	console.log(`\t- CACHE_ENABLED: ${CACHE_ENABLED}`);
});
