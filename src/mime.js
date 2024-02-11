export const mimeTypes = {
	html: "text/html",
	css: "text/css",
	js: "text/javascript",
	json: "application/json",
	png: "image/png",
	jpg: "image/jpeg",
	gif: "image/gif",
	txt: "text/plain",
	pdf: "application/pdf",
	doc: "application/msword",
	mp3: "audio/mpeg",
	mp4: "video/mp4",
	avi: "video/x-msvideo",
	zip: "application/zip",
	tar: "application/x-tar",
	rar: "application/x-rar-compressed",
	svg: "image/svg+xml",
	xml: "application/xml",
	php: "application/x-httpd-php",
	py: "text/x-python",
	rb: "text/x-ruby",
	java: "text/x-java",
	cpp: "text/x-c++src",
	c: "text/x-csrc",
	cs: "text/x-csharp",
	sh: "application/x-sh",
	sql: "application/sql",
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
	console.log(filename);
	const ext = filename.split(".")[1];
	return mimeTypes[ext];
};
