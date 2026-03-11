# Password Strength Meter Embed
## What it does
Injects a visual strength bar and label below `input[type=password]` fields on the host page. Evaluates length, uppercase, lowercase, digits, and symbols.
## Endpoints
| Path | Method | Description |
|------|--------|-------------|
| `GET /` | GET | Demo + embed builder |
| `GET /widget.js` | GET | Host-page injector |
## Embed
```html
<script src="https://your-worker.workers.dev/widget.js"
  data-input="input[type=password]">
</script>
```
## Tips
- Stateless – no bindings required.
- Call `PasswordMeter.attach(inputElement)` for dynamically created inputs.
