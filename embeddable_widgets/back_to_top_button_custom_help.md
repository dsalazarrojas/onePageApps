# Back to Top Button (Custom)
## What it does
Injects a smooth-scroll back-to-top button that fades in once the user scrolls past a configurable threshold.
## Endpoints
| Path | Method | Description |
|------|--------|-------------|
| `GET /` | GET | Builder UI |
| `GET /widget.js` | GET | Host-page injector |
## Embed
```html
<script src="https://your-worker.workers.dev/widget.js"
  data-icon="↑" data-bg="#1a73e8" data-fg="#ffffff"
  data-size="48" data-threshold="300">
</script>
```
## Tips
- Stateless – no bindings required. Uses `scroll-behavior: smooth`.
