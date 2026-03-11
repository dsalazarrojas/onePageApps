# Embeddable Video Background Picker
## What it does
Previews a video background with a configurable colour overlay and generates the HTML+CSS embed code for full-viewport video backgrounds.
## Endpoints
| Path | Method | Description |
|------|--------|-------------|
| `GET /` | GET | Video background builder |
| `GET /widget.js` | GET | Iframe injector |
## Embed
```html
<script src="https://your-worker.workers.dev/widget.js"></script>
```
## Tips
- Stateless – no bindings required.
- Use MP4/WebM videos hosted with CORS headers. Always use `muted` for autoplay to work in all browsers.
