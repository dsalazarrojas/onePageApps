# Mortgage Calculator Embed
## What it does
Calculates monthly mortgage payments, total interest, and total cost from home price, down payment, interest rate, and loan term.
## Endpoints
| Path | Method | Description |
|------|--------|-------------|
| `GET /` | GET | Mortgage calculator UI |
| `GET /widget.js` | GET | Iframe injector |
## Embed
```html
<script src="https://your-worker.workers.dev/widget.js"></script>
```
## Tips
- Stateless – no bindings required.
