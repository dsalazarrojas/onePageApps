# Currency Converter (Live)
## What it does
Converts between 20 currencies using the ExchangeRate-API public endpoint (no API key required for basic rates). Proxied through the worker to avoid CORS.
## Endpoints
| Path | Method | Description |
|------|--------|-------------|
| `GET /` | GET | Converter UI |
| `GET /widget.js` | GET | Iframe injector |
| `GET /convert?from=&to=&amount=` | GET | Returns `{from,to,amount,rate,result,date}` |
## Embed
```html
<script src="https://your-worker.workers.dev/widget.js"></script>
```
## Tips
- Uses the free ExchangeRate-API tier. Rates may be delayed 24 h.
- Stateless – no bindings required.
