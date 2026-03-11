# Embeddable Signature Pad
## What it does
Mouse and touch-enabled signature drawing canvas with adjustable pen colour/thickness. Download signature as PNG.
## Endpoints
| Path | Method | Description |
|------|--------|-------------|
| `GET /` | GET | Signature pad UI |
| `GET /widget.js` | GET | Iframe injector |
## Embed
```html
<script src="https://your-worker.workers.dev/widget.js"></script>
```
## Tips
- Stateless – no bindings required. Images stay client-side unless you add upload logic.
