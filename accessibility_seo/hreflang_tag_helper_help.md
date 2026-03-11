# Hreflang Tag Helper
## What it does
Generates `<link rel="alternate" hreflang="…">` tags for multilingual/multi-regional SEO from a list of URL + locale pairs.
## Endpoints
| Path | Method | Description |
|------|--------|-------------|
| `GET /` | GET | Tag generator UI |
| `GET /widget.js` | GET | Iframe injector |
## Embed
```html
<script src="https://your-worker.workers.dev/widget.js"></script>
```
## Tips
- Always include an `x-default` tag (auto-added pointing to the first URL).
- Stateless – no bindings required.
