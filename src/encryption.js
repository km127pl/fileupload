import crypto from 'node:crypto';
const { ENCRYPTION_KEY, ENCRYPTION_ALGO, ENCRYPTION_ENABLED } = process.env;

/**
 * Encrypts data
 * @param {*} data the data to encrypt
 * @returns the encrypted data
 * @example of using the function
 * ```js
 * const encrypted = encrypt("hello world");
 * console.log(encrypted); // => "..."
 * ```
 */
export const encrypt = (data) => {
	const iv = crypto.randomBytes(16);

	if (!ENCRYPTION_ALGO || typeof ENCRYPTION_ALGO !== 'string') {
		throw new Error('Encryption algorithm is missing or invalid.');
	}

	if (!ENCRYPTION_KEY || typeof ENCRYPTION_KEY !== 'string') {
		throw new Error('Encryption key is missing or invalid.');
	}

	const cipher = crypto.createCipheriv(
		ENCRYPTION_ALGO,
		Buffer.from(ENCRYPTION_KEY),
		iv
	);
	let encrypted = cipher.update(data);
	encrypted = Buffer.concat([encrypted, cipher.final()]);
	return iv.toString('hex') + ':' + encrypted.toString('hex');
};

/**
 * Decrypts data
 * @param {*} data the data to decrypt
 * @returns the decrypted data
 * @example of using the function
 * ```js
 * const decrypted = decrypt("...");
 * console.log(decrypted); // => "hello world"
 * ```
 */
export const decrypt = (data) => {
	const textParts = data.split(':');
	const iv = Buffer.from(textParts.shift(), 'hex');

	if (!ENCRYPTION_ALGO || typeof ENCRYPTION_ALGO !== 'string') {
		throw new Error('Encryption algorithm is missing or invalid.');
	}

	if (!ENCRYPTION_KEY || typeof ENCRYPTION_KEY !== 'string') {
		throw new Error('Encryption key is missing or invalid.');
	}
	const encryptedText = Buffer.from(textParts.join(':'), 'hex');
	const decipher = crypto.createDecipheriv(
		ENCRYPTION_ALGO,
		Buffer.from(ENCRYPTION_KEY),
		iv
	);
	let decrypted = decipher.update(encryptedText);
	decrypted = Buffer.concat([decrypted, decipher.final()]);
	return decrypted; // return a buffer
};
