# Fake Data Generator Widget
## What it does
Generates realistic fake data for users, emails, addresses, UUIDs, colors, IPs, dates, and Lorem sentences. Output in JSON, CSV, or list format.
## Endpoints
| Path | Method | Description |
|------|--------|-------------|
| `GET /` | GET | Data generator UI |
| `GET /widget.js` | GET | Iframe injector |
## Embed
```html
<script src="https://your-worker.workers.dev/widget.js"></script>
```
## Tips
- Stateless – no bindings required. All data is generated client-side.
