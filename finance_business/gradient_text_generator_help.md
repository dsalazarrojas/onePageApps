# Gradient Text Generator
## What it does
Generates CSS gradient text with live preview. Exports clean CSS using `background-clip: text`.
## Endpoints
| Path | Method | Description |
|------|--------|-------------|
| `GET /` | GET | Gradient text designer |
| `GET /widget.js` | GET | Iframe injector |
## Embed
```html
<script src="https://your-worker.workers.dev/widget.js"></script>
```
## Tips
- Stateless – no bindings required.
- `background-clip: text` has broad browser support but requires vendor prefix for Chrome/Safari.
