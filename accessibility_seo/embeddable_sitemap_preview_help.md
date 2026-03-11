# Embeddable Sitemap Preview
## What it does
Fetches and parses an XML sitemap via the worker (bypassing CORS) and displays all `<loc>` URLs in a clickable list. Useful for auditing site structure.
## Endpoints
| Path | Method | Description |
|------|--------|-------------|
| `GET /` | GET | Sitemap browser UI |
| `GET /widget.js` | GET | Iframe injector |
| `GET /fetch?url=` | GET | Returns `{urls, total}` JSON |
## Embed
```html
<script src="https://your-worker.workers.dev/widget.js"></script>
```
## Tips
- Stateless – no bindings required.
- Returns up to 100 URLs per fetch. For large sitemaps, paginate via the index sitemap.
