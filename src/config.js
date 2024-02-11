export const config = {
	upload: {
		maxSize: 1024 * 1024 * 1024, // 1GB
		directory: './uploads',
	},
	privacy: {
		idLength: 12,
		encryption: {
			// Warning: Enabling or disabling encryption will make all previously uploaded files unreadable
			// Only toggle this if you are sure you want to reset the uploaded files.
			enabled: true,
			algorithm: 'aes-256-cbc',
			// Key is in the `.env` file
		},
	},
	webserver: {
		port: 8080,
	},
};
