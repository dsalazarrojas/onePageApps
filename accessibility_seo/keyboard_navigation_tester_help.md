# Keyboard Navigation Tester
## What it does
Enhances keyboard focus visibility on the host page and shows a small badge (bottom-left) identifying the currently focused element when the user navigates with Tab/Arrow keys.
## Endpoints
| Path | Method | Description |
|------|--------|-------------|
| `GET /` | GET | Builder UI |
| `GET /widget.js` | GET | Host-page injector |
## Embed
```html
<script src="https://your-worker.workers.dev/widget.js"
  data-outline="2px solid #1a73e8"
  data-highlight="true">
</script>
```
## Tips
- Useful during accessibility audits. Remove from production or gate behind a query param.
- Stateless – no bindings required.
