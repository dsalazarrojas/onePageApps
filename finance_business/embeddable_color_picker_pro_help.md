# Embeddable Color Picker Pro
## What it does
Advanced colour picker showing HEX, RGB, and HSL values with click-to-copy, plus auto-generated tints and shades. Click any shade to update the picker.
## Endpoints
| Path | Method | Description |
|------|--------|-------------|
| `GET /` | GET | Color picker UI |
| `GET /widget.js` | GET | Iframe injector |
## Embed
```html
<script src="https://your-worker.workers.dev/widget.js"></script>
```
## Tips
- Stateless – no bindings required.
