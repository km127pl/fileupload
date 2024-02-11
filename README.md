## File Upload

A quick file upload server in pure NodeJS and HTML.

### Todo

- [x] - Handle images (as well as other Non-UTF8 files)
- [x] - Full on drag n' drop support on `/`
- [x] - File size limits
- [ ] - Syntax hightlighted preview for code files (.c, .js etc.)
- [ ] - `/i/{id}/{file}` for basic file info (size, mime, uploaded at, etc.)
- [ ] - `/v/{id}/{file}` for previewing files
- [ ] - `/d/{id}/{file}` for direct downloading files

### Routes
- `GET /` - Homepage
- `GET /uploaded?id={}&file={}` - File uploaded successfuly dialog
- `POST /upload` - File upload endpoint