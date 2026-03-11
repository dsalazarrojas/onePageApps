# Embeddable Table of Contents
## What it does
Scans the host page for heading elements and builds a collapsible table of contents widget. Automatically adds anchor IDs to headings.
## Endpoints
| Path | Method | Description |
|------|--------|-------------|
| `GET /` | GET | Builder UI |
| `GET /widget.js` | GET | Host-page injector |
## Embed
```html
<script src="https://your-worker.workers.dev/widget.js"
  data-headings="h2,h3"
  data-title="Contents"
  data-collapsible="true">
</script>
```
## Tips
- Place the script before your article content or in `<head>` with `defer`.
- Stateless – no bindings required.
