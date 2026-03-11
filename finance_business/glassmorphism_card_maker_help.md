# Glassmorphism Card Maker
## What it does
Designs glassmorphism cards with live preview. Adjustable blur, opacity, border, and colour. Exports clean CSS.
## Endpoints
| Path | Method | Description |
|------|--------|-------------|
| `GET /` | GET | Glassmorphism designer |
| `GET /widget.js` | GET | Iframe injector |
## Embed
```html
<script src="https://your-worker.workers.dev/widget.js"></script>
```
## Tips
- Stateless – no bindings required.
- `backdrop-filter` requires a background element behind the card with some colour or image.
