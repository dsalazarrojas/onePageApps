# Meta Tag Live Preview Embed
## What it does
Provides a live preview of Google Search snippets and Open Graph social cards as you type meta tag values. Generates the complete set of `<head>` tags to copy.
## Endpoints
| Path | Method | Description |
|------|--------|-------------|
| `GET /` | GET | Live preview UI |
| `GET /widget.js` | GET | Iframe injector |
## Embed
```html
<script src="https://your-worker.workers.dev/widget.js"></script>
```
## Tips
- Stateless – no bindings required. All processing is client-side.
- Keep titles ≤60 chars and descriptions ≤160 chars for best SERP display.
