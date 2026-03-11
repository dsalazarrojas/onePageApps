# Dark Mode Toggle Widget
## What it does
Injects a floating toggle button that adds/removes a CSS class on `<html>`. Reads `prefers-color-scheme` on first load, persists preference via `localStorage`.
## Endpoints
| Path | Method | Description |
|------|--------|-------------|
| `GET /` | GET | Builder UI |
| `GET /widget.js` | GET | Host-page injector |
## Embed
```html
<script src="https://your-worker.workers.dev/widget.js"
  data-dark-class="dark-mode" data-light-icon="☀️"
  data-dark-icon="🌙" data-position="bottom-right" data-size="44">
</script>
```
## Tips
- Style dark theme with `html.dark-mode { … }` CSS.
- Stateless – no bindings required.
