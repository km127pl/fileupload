import crypto from 'node:crypto';
import { config } from './config.js';

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
	const algorithm = config.privacy.encryption.algorithm;
	const encryptionKey = process.env.ENCRYPTION_KEY;

	if (!algorithm || typeof algorithm !== 'string') {
		throw new Error('Encryption algorithm is missing or invalid.');
	}

	if (!encryptionKey || typeof encryptionKey !== 'string') {
		throw new Error('Encryption key is missing or invalid.');
	}

	const cipher = crypto.createCipheriv(
		config.privacy.encryption.algorithm,
		Buffer.from(process.env.ENCRYPTION_KEY),
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

	const algorithm = config.privacy.encryption.algorithm;
	const encryptionKey = process.env.ENCRYPTION_KEY;
	if (!algorithm || typeof algorithm !== 'string') {
		throw new Error('Encryption algorithm is missing or invalid.');
	}

	if (!encryptionKey || typeof encryptionKey !== 'string') {
		throw new Error('Encryption key is missing or invalid.');
	}
	const encryptedText = Buffer.from(textParts.join(':'), 'hex');
	const decipher = crypto.createDecipheriv(
		algorithm,
		Buffer.from(encryptionKey),
		iv
	);
	let decrypted = decipher.update(encryptedText);
	decrypted = Buffer.concat([decrypted, decipher.final()]);
	return decrypted; // return a buffer
};
