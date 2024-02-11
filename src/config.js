export const config = {
	upload: {
		maxSize: 1024 * 1024 * 1024, // 1GB
		directory: './uploads',
	},
	privacy: {
		idLength: 12,
		encryption: {
			enabled: true,
			algorithm: 'aes-256-cbc',
			// IV and KEY are in the `.env` file
		},
	},
	webserver: {
		port: 8080,
	},
};
