# Embeddable Breadcrumb Generator
## What it does
Injects an accessible breadcrumb `<nav>` directly on the host page. Can auto-generate crumbs from the current URL path or be built programmatically via `Breadcrumb.add()`.
## Endpoints
| Path | Method | Description |
|------|--------|-------------|
| `GET /` | GET | Builder UI |
| `GET /widget.js` | GET | Host-page injector |
## Embed
```html
<script src="https://your-worker.workers.dev/widget.js"
  data-separator="/"
  data-auto="true">
</script>
```
## Programmatic usage
```js
Breadcrumb.add('Products', '/products');
Breadcrumb.add('Widget Pro', '#', true); // current page
```
## Tips
- Stateless – no bindings required.
- Generates Schema.org-compatible markup when paired with the schema_markup_embed_generator.
