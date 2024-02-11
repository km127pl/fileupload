export const mimeTypes = {
	html: "text/html",
	css: "text/css",
	js: "text/javascript",
	json: "application/json",
	png: "image/png",
	jpg: "image/jpeg",
	gif: "image/gif",
	txt: "text/plain",
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
