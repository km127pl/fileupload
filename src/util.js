/**
 * Creates a random token of n length
 * @param {*} length length of the token
 * @see https://stackoverflow.com/questions/1349404/generate-random-string-characters-in-javascript
 * @returns the random token
 */
export const genToken = (length) => {
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
 * Prettify a size
 * @param {*} size the size
 * @returns the pretty size
 * @example
 * prettifySize(1024) // 1 KB
 * prettifySize(1024 * 1024) // 1 MB
 */
export const prettifySize = (size) => {
	const units = ['B', 'KiB', 'MiB', 'GiB', 'TiB'];
	let counter = 0;
	while (size >= 1024) {
		size /= 1024;
		counter += 1;
	}
	const fixedPoints = size <= 10 ? 2 : 0;
	return `${size.toFixed(fixedPoints).split('.00').join('')} ${units[counter]}`;
};
