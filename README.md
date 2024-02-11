> [!CAUTION]
> Not ready for production use, use at your own risk.

## File Upload

![](https://img.shields.io/badge/Node%20js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)
![](https://img.shields.io/badge/Tailwind%20CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)
![](https://img.shields.io/badge/HTML5-E34F26?style=for-the-badge&logo=html5&logoColor=white)
![](https://img.shields.io/badge/prettier-1A2C34?style=for-the-badge&logo=prettier&logoColor=F7BA3E)

A quick file upload server in pure NodeJS and HTML.

## Setup

-   Requires Node 18 or higher (20.x for encryption)
-   Clone the repo
-   Copy `.env.example` to `.env` and fill in the values, if you need encryption use `openssl rand -hex 16` for the key.
-   Run it with `npm start` or `node --env-file=.env src/app.js`

### Todo

-   [ ] -   In memory file cache (warm)
-   [ ] -   [ShareX](https://getsharex.com/) support
-   [ ] -   Rate limiting (10 per 2 minutes)
-   [ ] -   Client side error handling
-   [x] -   Properly use tailwindcss and not the play cdn
-   [x] -   Syntax hightlighted preview for code files (.c, .js etc.)
-   [x] -   `/v/{id}/{file}` for previewing files
-   [x] -   Fix getting a "411 Length Required" on some bigger files
-   [x] -   Handle images (as well as other Non-UTF8 files)
-   [x] -   Full on drag n' drop support on `/`
-   [x] -   File size limits
-   [x] -   File encryption
-   [x] -   `/i/{id}/{file}` for basic file info (size, mime, uploaded at, etc.)
-   [x] -   `/d/{id}/{file}` for direct downloading files

### Routes

-   `GET /` - Homepage
-   `GET /uploaded?id={}&file={}` - File uploaded successfuly dialog
-   `GET /i/{id}/{file}` - File info endpoint
-   `GET /d/{id}/{file}` - File download endpoint
-   `GET /v/{id}/{file}` - File view endpoint
-   `POST /upload` - File upload endpoint
