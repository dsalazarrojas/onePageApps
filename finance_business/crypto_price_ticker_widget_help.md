# Crypto Price Ticker Widget
## What it does
Displays live cryptocurrency prices and 24 h change percentages via the CoinGecko public API, proxied through the worker. Auto-refreshes every 60 seconds.
## Endpoints
| Path | Method | Description |
|------|--------|-------------|
| `GET /` | GET | Crypto ticker UI |
| `GET /widget.js` | GET | Iframe injector |
| `GET /prices?ids=` | GET | Proxied CoinGecko prices JSON |
## Embed
```html
<script src="https://your-worker.workers.dev/widget.js"></script>
```
## Tips
- Stateless – no bindings required.
- CoinGecko free tier has rate limits; avoid embedding on very high traffic pages.
