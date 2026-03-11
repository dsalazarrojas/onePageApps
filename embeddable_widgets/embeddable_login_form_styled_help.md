# Embeddable Login Form (Styled)
## What it does
Serves a beautifully styled login form that can be embedded via an iframe-injecting script. Purely presentational – wire up the `<form>` `action` or submit handler to your own auth endpoint.
## Endpoints
| Path | Method | Description |
|------|--------|-------------|
| `GET /` | GET | Styled login page |
| `GET /widget.js` | GET | Iframe injector |
## Embed
```html
<script src="https://your-worker.workers.dev/widget.js"
  data-height="480">
</script>
```
## Tips
- Stateless – no bindings required.
- Fork the worker and modify the form `action` and fields to match your authentication system.
