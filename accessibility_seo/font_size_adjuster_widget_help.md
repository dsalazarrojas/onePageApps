# Font Size Adjuster Widget
## What it does
Injects an A-/A+ control that adjusts the root `font-size` percentage on the host page. Persists choice in `localStorage`.
## Endpoints
| Path | Method | Description |
|------|--------|-------------|
| `GET /` | GET | Builder UI |
| `GET /widget.js` | GET | Host-page injector |
## Embed
```html
<script src="https://your-worker.workers.dev/widget.js"
  data-min="80" data-max="140" data-step="10"
  data-default="100" data-position="bottom-right">
</script>
```
## Tips
- Requires your CSS to use `rem`/`em` units to respond to root font-size changes.
- Stateless – no bindings required.
