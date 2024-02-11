export const config = {
	upload: {
		maxSize: 1024 * 1024 * 1024, // 1GB
		directory: "./uploads",
	},
	privacy: {
		idLength: 64,
	},
	webserver: {
		port: 8080,
	},
};
