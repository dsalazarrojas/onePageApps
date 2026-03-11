# Sticky Header Customizer
## What it does
Makes any matching HTML element sticky at the top of the viewport and adds/removes a class when the page has scrolled past a threshold (for applying shadows or styles).
## Endpoints
| Path | Method | Description |
|------|--------|-------------|
| `GET /` | GET | Builder UI |
| `GET /widget.js` | GET | Host-page injector |
## Embed
```html
<script src="https://your-worker.workers.dev/widget.js"
  data-selector="header, nav"
  data-sticky-class="is-sticky"
  data-scrolled-class="scrolled"
  data-threshold="80"
  data-shadow="true">
</script>
```
## Tips
- Style `.scrolled { background: #fff; }` in your CSS for colour changes on scroll.
- Stateless – no bindings required.
