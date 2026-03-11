# Embeddable Neumorphism Generator
## What it does
Creates soft neumorphic box-shadow CSS with live preview. Adjustable blur, distance, intensity, and border-radius.
## Endpoints
| Path | Method | Description |
|------|--------|-------------|
| `GET /` | GET | Neumorphism designer |
| `GET /widget.js` | GET | Iframe injector |
## Embed
```html
<script src="https://your-worker.workers.dev/widget.js"></script>
```
## Tips
- Stateless – no bindings required.
- Best effect when background and element share the same base colour.
