# Embeddable Structured Data Tester
## What it does
Validates JSON-LD structured data client-side: checks for required `@context` and `@type` fields, lists all properties, and links to the schema.org type definition.
## Endpoints
| Path | Method | Description |
|------|--------|-------------|
| `GET /` | GET | Validator UI |
| `GET /widget.js` | GET | Iframe injector |
## Embed
```html
<script src="https://your-worker.workers.dev/widget.js"></script>
```
## Tips
- Stateless – no bindings required. All validation is client-side.
- For full rich-result eligibility testing, use Google's Rich Results Test tool.
