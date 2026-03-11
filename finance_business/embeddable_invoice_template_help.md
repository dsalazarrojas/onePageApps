# Embeddable Invoice Template
## What it does
Fully editable in-browser invoice with auto-calculating totals, tax, and print-to-PDF support. Add/remove line items, customise currency symbol.
## Endpoints
| Path | Method | Description |
|------|--------|-------------|
| `GET /` | GET | Invoice editor |
| `GET /widget.js` | GET | Iframe injector |
## Embed
```html
<script src="https://your-worker.workers.dev/widget.js"></script>
```
## Tips
- Use browser Print → Save as PDF to export the invoice.
- Stateless – no bindings required. Data is not saved automatically.
