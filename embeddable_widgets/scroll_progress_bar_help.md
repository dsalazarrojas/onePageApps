# Scroll Progress Bar
## What it does
Injects a fixed-position reading progress bar at the top of the host page. Uses a passive scroll listener for optimal performance.
## Endpoints
| Path | Method | Description |
|------|--------|-------------|
| `GET /` | GET | Config & embed builder |
| `GET /widget.js` | GET | Host-page injector |
## Embed
```html
<script src="https://your-worker.workers.dev/widget.js"
  data-color="#1a73e8" data-height="4">
</script>
```
## Tips
- Stateless – no bindings required. ~600 B injector.
