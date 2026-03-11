# Floating Action Button Widget
## What it does
Injects a customisable floating action button (FAB) directly onto the host page. Supports any emoji/text icon, link, position, colour, and size.
## Endpoints
| Path | Method | Description |
|------|--------|-------------|
| `GET /` | GET | Builder UI |
| `GET /widget.js` | GET | Host-page injector |
## Embed
```html
<script src="https://your-worker.workers.dev/widget.js"
  data-icon="💬" data-href="https://chat.example.com"
  data-tooltip="Chat" data-bg="#1a73e8"
  data-position="bottom-right" data-size="56">
</script>
```
## Tips
- Stateless – no bindings required.
