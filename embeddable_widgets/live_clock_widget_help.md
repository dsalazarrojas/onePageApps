# Live Clock Widget
## What it does
Injects a live digital clock inline on the host page. Supports any IANA timezone.
## Endpoints
| Path | Method | Description |
|------|--------|-------------|
| `GET /` | GET | Builder with live preview |
| `GET /widget.js` | GET | Host-page injector |
## Embed
```html
<script src="https://your-worker.workers.dev/widget.js"
  data-timezone="America/New_York"
  data-label="New York"
  data-theme="dark">
</script>
```
## Tips
- Stateless – no bindings required.
- Clock renders inline next to the `<script>` tag.
