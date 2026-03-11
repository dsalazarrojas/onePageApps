# Embeddable Quote of the Day
## What it does
Serves a daily rotating inspirational quote as an embeddable iframe. Cycles through 10 curated quotes based on the UTC day number.
## Endpoints
| Path | Method | Description |
|------|--------|-------------|
| `GET /` | GET | Quote card page (embeddable) |
| `GET /widget.js` | GET | Iframe injector |
## Embed
```html
<script src="https://your-worker.workers.dev/widget.js"></script>
```
## Tips
- Stateless – no bindings required. Quote changes daily.
- Customise the QUOTES array in the worker to add your own quotes.
