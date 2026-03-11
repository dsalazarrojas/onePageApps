# Notification Toast System
## What it does
Injects a `Toast` global object on the host page for programmatic toast notifications. Supports info, success, warning, and error types with auto-dismiss and optional close button.
## Endpoints
| Path | Method | Description |
|------|--------|-------------|
| `GET /` | GET | Demo page with live examples |
| `GET /widget.js` | GET | Host-page injector |
## Embed
```html
<script src="https://your-worker.workers.dev/widget.js"></script>
<script>
  Toast.success('Profile saved!');
  Toast.error('Network error', { duration: 0, dismissible: true });
</script>
```
## API
```js
Toast.show(message, { type, duration, dismissible })
Toast.info(message, opts)
Toast.success(message, opts)
Toast.warning(message, opts)
Toast.error(message, opts)
```
## Tips
- `duration: 0` means no auto-dismiss.
- Stateless – no bindings required.
