# Stock Chart Lite Embed

## What it does
Loads up to 90 recent daily closes for a ticker symbol, draws a lightweight line chart, and falls back to simulated data if the upstream source is unavailable.

## Endpoints
| Path | Method | Description |
|------|--------|-------------|
| `GET /` | GET | Interactive stock chart viewer |
| `GET /prices` | GET | Returns chart data for a symbol |
| `GET /widget.js` | GET | Iframe embed loader |

## Embed
```html
<script src="https://your-worker.workers.dev/widget.js" data-symbol="AAPL"></script>
```

## Tips
- Uses a free Stooq CSV endpoint when available.
- Falls back to simulated prices so the widget always remains usable and stateless.
