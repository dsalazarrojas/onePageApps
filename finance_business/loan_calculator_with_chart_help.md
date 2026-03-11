# Loan Calculator with Chart
## What it does
Calculates monthly loan payment, total payment, and total interest with a balance-over-time chart drawn on a `<canvas>`.
## Endpoints
| Path | Method | Description |
|------|--------|-------------|
| `GET /` | GET | Loan calculator with chart |
| `GET /widget.js` | GET | Iframe injector |
## Embed
```html
<script src="https://your-worker.workers.dev/widget.js"></script>
```
## Tips
- Stateless – no bindings required.
