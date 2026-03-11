# Embeddable Image Gallery Slider
## What it does
Injects a responsive image carousel directly inline on the host page. Supports prev/next navigation, dot indicators, and optional auto-advance.
## Endpoints
| Path | Method | Description |
|------|--------|-------------|
| `GET /` | GET | Builder UI |
| `GET /widget.js` | GET | Host-page injector |
## Embed
```html
<script src="https://your-worker.workers.dev/widget.js"
  data-images='["https://example.com/img1.jpg","https://example.com/img2.jpg"]'
  data-height="320"
  data-auto="3000">
</script>
```
## Tips
- Stateless – no bindings required.
- Images are loaded directly from their source URLs; no proxying.
