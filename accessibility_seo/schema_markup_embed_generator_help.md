# Schema Markup Embed Generator
## What it does
Generates valid JSON-LD structured data for Article, FAQ, Product, and Local Business schema types. Output can be pasted into the `<head>` of any page.
## Endpoints
| Path | Method | Description |
|------|--------|-------------|
| `GET /` | GET | Interactive schema builder |
| `GET /widget.js` | GET | Iframe injector |
## Embed
```html
<script src="https://your-worker.workers.dev/widget.js"></script>
```
## Tips
- Stateless – no bindings required.
- Validate the generated JSON-LD with Google's Rich Results Test.
