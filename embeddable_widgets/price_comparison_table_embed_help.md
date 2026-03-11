# Price Comparison Table Embed
## What it does
Editable pricing comparison table with auto-highlighting of the cheapest option. Add/remove rows and columns. Export to CSV.
## Endpoints
| Path | Method | Description |
|------|--------|-------------|
| `GET /` | GET | Comparison table editor |
| `GET /widget.js` | GET | Iframe injector |
## Embed
```html
<script src="https://your-worker.workers.dev/widget.js"></script>
```
## Tips
- Stateless – no bindings required. Data is not persisted between sessions.
