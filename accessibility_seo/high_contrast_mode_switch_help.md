# High Contrast Mode Switch
## What it does
Injects a button that toggles a high-contrast CSS filter (`contrast(2) grayscale(.3)`) on the document root, with `localStorage` persistence.
## Endpoints
| Path | Method | Description |
|------|--------|-------------|
| `GET /` | GET | Builder UI |
| `GET /widget.js` | GET | Host-page injector |
## Embed
```html
<script src="https://your-worker.workers.dev/widget.js"
  data-class="high-contrast"
  data-position="bottom-right">
</script>
```
## Tips
- Override the CSS filter in `.high-contrast` to customise the visual effect.
- Stateless – no bindings required.
