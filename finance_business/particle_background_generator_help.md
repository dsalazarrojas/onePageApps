# Particle Background Generator
## What it does
Animated canvas particle background with configurable count, size, speed, and colours. Exports a setup snippet for integration.
## Endpoints
| Path | Method | Description |
|------|--------|-------------|
| `GET /` | GET | Particle animator |
| `GET /widget.js` | GET | Iframe injector |
## Embed
```html
<script src="https://your-worker.workers.dev/widget.js"></script>
```
## Tips
- Stateless – no bindings required.
- For production use, consider reducing particle count on mobile for performance.
