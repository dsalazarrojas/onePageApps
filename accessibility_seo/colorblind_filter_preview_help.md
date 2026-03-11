# Colorblind Filter Preview
## What it does
Applies SVG colour-matrix filters to simulate Protanopia, Deuteranopia, Tritanopia, and Achromatopsia colour blindness on any image URL.
## Endpoints
| Path | Method | Description |
|------|--------|-------------|
| `GET /` | GET | Visual comparison UI |
| `GET /widget.js` | GET | Iframe injector |
## Embed
```html
<script src="https://your-worker.workers.dev/widget.js"></script>
```
## Tips
- Stateless – no bindings required. All filters run client-side via SVG.
- Use alongside a contrast checker to ensure your palette is accessible.
