# Cookie Consent Banner
## What it does
Injects a GDPR-style cookie consent bar at the bottom of the host page. Stores choice in `localStorage` and fires a `cookieConsent` custom event.
## Endpoints
| Path | Method | Description |
|------|--------|-------------|
| `GET /` | GET | Embed-code builder |
| `GET /widget.js` | GET | Host-page injector |
## Embed
```html
<script src="https://your-worker.workers.dev/widget.js"
  data-message="We use cookies." data-policy="https://example.com/privacy"
  data-accept="Accept" data-decline="Decline" data-bg="#111827">
</script>
```
## Tips
- Listen: `document.addEventListener('cookieConsent', e => console.log(e.detail.action))`
- Stateless – no bindings required.
