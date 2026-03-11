# Embeddable Search Bar
## What it does
Injects a styled search form on the host page. Can target any search endpoint (Google, site search, etc.) by configuring the action URL and parameter name.
## Endpoints
| Path | Method | Description |
|------|--------|-------------|
| `GET /` | GET | Builder UI |
| `GET /widget.js` | GET | Host-page injector |
## Embed
```html
<script src="https://your-worker.workers.dev/widget.js"
  data-action="https://www.google.com/search"
  data-param="q"
  data-placeholder="Search…"
  data-accent="#1a73e8">
</script>
```
## Tips
- Stateless – no bindings required.
- For site search, use your own search endpoint URL.
