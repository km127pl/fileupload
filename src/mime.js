export const mimeTypes = {
	html: 'text/html',
	css: 'text/css',
	js: 'text/javascript',
	json: 'application/json',
	png: 'image/png',
	jpg: 'image/jpeg',
	gif: 'image/gif',
	txt: 'text/plain',
	pdf: 'application/pdf',
	doc: 'application/msword',
	mp3: 'audio/mpeg',
	mp4: 'video/mp4',
	avi: 'video/x-msvideo',
	zip: 'application/zip',
	tar: 'application/x-tar',
	rar: 'application/x-rar-compressed',
	svg: 'image/svg+xml',
	xml: 'application/xml',
	php: 'application/x-httpd-php',
	py: 'text/x-python',
	rb: 'text/x-ruby',
	java: 'text/x-java',
	cpp: 'text/x-c++src',
	c: 'text/x-csrc',
	cs: 'text/x-csharp',
	sh: 'application/x-sh',
	sql: 'application/sql',
};

/**
 * Gets a mime type for a file name
 * @param {*} filename the filename (e.g. `test.txt`)
 * @returns the mime type
 * @example of using the function
 * ```js
 * const mime = mimeFor("test.txt");
 * console.log(mime); // => text/plain
 * ```
 */
export const mimeFor = (filename) => {
	const ext = filename.split('.')[1];
	return mimeTypes[ext] || 'application/octet-stream';
};

/**
 * Gets an extension from a mime type
 * @param {*} mimeType the mime type
 * @returns the extension
 * @example of using the function
 * ```js
 * const ext = fromMime("text/plain");
 * console.log(ext); // => .txt
 * ```
 */
export const fromMime = (mimeType) => {
	for (const ext in mimeTypes) {
		if (mimeTypes.hasOwnProperty(ext) && mimeTypes[ext] === mimeType) {
			return ext;
		}
	}
	return null;
};

/**
 * Checks if a file can be previewed
 * @param {*} filename the filename
 * @returns true if the file can be previewed
 */
export const canPreview = (filename) => {
	const ext = filename.split('.').pop();
	return ['png', 'jpg', 'gif', 'mp4', 'mp3', 'avi', 'pdf', 'txt'].includes(
		ext
	);
};

export const previewTypes = {
	png: 'image',
	jpg: 'image',
	gif: 'image',
	mp4: 'video',
	mp3: 'audio',
	avi: 'video',
	pdf: 'pdf',
	txt: 'code',
	c: 'code',
	cpp: 'code',
	java: 'code',
	py: 'code',
	js: 'code',
	html: 'code',
	css: 'code',
	sh: 'code',
	sql: 'code',
	xml: 'code',
	json: 'code',
};

const previewTypeFor = (filename) => {
	const ext = filename.split('.').pop();
	return previewTypes[ext] || 'unsupported';
};

export const createPreview = (filename, content) => {
	const type = previewTypeFor(filename);

	let preview;

	switch (type) {
		case 'image':
			preview = `<img src="data:${mimeFor(filename)};base64,${content.toString('base64')}" class="w-1/2 mx-auto" />`;
			break;
		case 'audio':
			preview = `<audio controls><source src="data:${mimeFor(filename)};base64,${content.toString('base64')}" type="${mimeFor(filename)}" /></audio>`;
			break;
		case 'code':
			preview = `<pre><code>${content.toString()}</code></pre>`;
			break;
		default:
			preview = `<span class="text-white">This file cannot be previewed</span>`;
	}

	return `<div class="flex flex-col w-full bg-neutral-900 p-1 sm:rounded-xl text-sm sm:border sm:border-white/5 ${preview == 'unsupported' ? 'h-96' : 'h-auto p-4'} overflow-auto">
${preview}
</div>`;
};
