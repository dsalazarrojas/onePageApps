# Embeddable Rating Stars

Persistent star rating widget backed by KV. Supports multiple items.

## Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/` | Demo UI |
| POST | `/rate` | Submit a rating |
| GET | `/stats?item=NAME` | Get average & count |
| GET | `/widget.js` | Embeddable widget script |

## Embed

```html
<div id="rating-widget"></div>
<script>window.RatingWidget = { item: 'my-product' };</script>
<script src="https://YOUR_WORKER.workers.dev/widget.js"></script>
```

## KV Binding

```toml
[[kv_namespaces]]
binding = "DATA"
id = "YOUR_KV_ID"
```
