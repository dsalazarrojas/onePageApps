# Language Switcher Embed
## What it does
Injects a fixed-position language selector dropdown on the host page. Navigates to the URL configured for the selected locale.
## Endpoints
| Path | Method | Description |
|------|--------|-------------|
| `GET /` | GET | Builder UI |
| `GET /widget.js` | GET | Host-page injector |
## Embed
```html
<script src="https://your-worker.workers.dev/widget.js"
  data-langs='[{"code":"en","label":"English","url":"/","flag":"🇺🇸"},{"code":"es","label":"Español","url":"/es","flag":"🇪🇸"}]'
  data-current="en" data-position="top-right">
</script>
```
## Tips
- Pair with `<html lang="…">` and hreflang meta tags for SEO.
- Stateless – no bindings required.
