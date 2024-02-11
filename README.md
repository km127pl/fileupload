## File Upload

![](https://img.shields.io/badge/Node%20js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)
![](https://img.shields.io/badge/Tailwind%20CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)
![](https://img.shields.io/badge/HTML5-E34F26?style=for-the-badge&logo=html5&logoColor=white)
![](https://img.shields.io/badge/prettier-1A2C34?style=for-the-badge&logo=prettier&logoColor=F7BA3E)

A quick file upload server in pure NodeJS and HTML.

### Todo

-   [x] -   Handle images (as well as other Non-UTF8 files)
-   [x] -   Full on drag n' drop support on `/`
-   [x] -   File size limits
-   [ ] -   Properly use tailwindcss and not the play cdn
-   [ ] -   File encryption\*
-   [ ] -   Syntax hightlighted preview for code files (.c, .js etc.)
-   [x] -   `/i/{id}/{file}` for basic file info (size, mime, uploaded at, etc.)
-   [ ] -   `/v/{id}/{file}` for previewing files
-   [x] -   `/d/{id}/{file}` for direct downloading files

\*Would probably require authentication of some sorts, so only a certain user can download a file.

### Routes

-   `GET /` - Homepage
-   `GET /uploaded?id={}&file={}` - File uploaded successfuly dialog
-   `GET /i/{id}/{file}` - File info endpoint
-   `GET /d/{id}/{file}` - File download endpoint
-   `POST /upload` - File upload endpoint
