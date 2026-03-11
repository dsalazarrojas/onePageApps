# Exit Intent Popup Generator
## What it does
Injects a modal popup triggered when the user's cursor exits the viewport from the top. Shown once per session via `sessionStorage`.
## Endpoints
| Path | Method | Description |
|------|--------|-------------|
| `GET /` | GET | Builder UI |
| `GET /widget.js` | GET | Host-page injector |
## Embed
```html
<script src="https://your-worker.workers.dev/widget.js"
  data-title="Wait! Before you go…"
  data-message="Subscribe for exclusive deals."
  data-cta="Subscribe" data-cta-url="https://example.com/subscribe"
  data-delay="500">
</script>
```
## Tips
- Stateless – no bindings required. Shown once per session.
