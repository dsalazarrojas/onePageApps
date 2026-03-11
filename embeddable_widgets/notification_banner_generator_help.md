# Notification Banner Generator
## What it does
Generates a top/bottom notification banner and produces a `<script>` embed tag. Injects behaviour directly on the host page. Dismissal is persisted in `localStorage` per message.
## Endpoints
| Path | Method | Description |
|------|--------|-------------|
| `GET /` | GET | Interactive banner builder |
| `GET /widget.js` | GET | Host-page injector |
## Embed
```html
<script src="https://your-worker.workers.dev/widget.js"
  data-message="🎉 Welcome!"
  data-bg="#1a73e8" data-fg="#fff"
  data-position="top" data-duration="5000" data-dismissible="true">
</script>
```
## Tips
- Stateless – no bindings required.
- Uses `localStorage` to suppress repeat impressions per message text.
