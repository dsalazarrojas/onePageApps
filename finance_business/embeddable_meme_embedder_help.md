# Embeddable Meme Maker
## What it does
Creates memes from a URL or uploaded image with top/bottom text overlay. Downloads as PNG.
## Endpoints
| Path | Method | Description |
|------|--------|-------------|
| `GET /` | GET | Meme maker UI |
| `GET /widget.js` | GET | Iframe injector |
## Embed
```html
<script src="https://your-worker.workers.dev/widget.js"></script>
```
## Tips
- Stateless – no bindings required. Images are processed entirely client-side.
- For cross-origin image URLs, the image must have CORS headers or be uploaded directly.
