# Embeddable Tip Calculator Widget
## What it does
Calculates tip and per-person split from a bill amount. Preset tip buttons (10–25%) and custom tip input.
## Endpoints
| Path | Method | Description |
|------|--------|-------------|
| `GET /` | GET | Tip calculator UI |
| `GET /widget.js` | GET | Iframe injector |
## Embed
```html
<script src="https://your-worker.workers.dev/widget.js"></script>
```
## Tips
- Stateless – no bindings required.
