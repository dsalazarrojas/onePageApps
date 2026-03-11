# Embeddable Heatmap Lite

Lightweight click-heatmap tracker using KV storage. Up to 5 000 clicks per page path.

## Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/` | Heatmap viewer UI |
| POST | `/click` | Record a click event |
| GET | `/data?page=PATH` | Get click data for a page |
| POST | `/reset` | Clear data for a page |
| GET | `/embed.js` | Tracker script to embed |

## Embed tracker

```html
<script src="https://YOUR_WORKER.workers.dev/embed.js"></script>
```

## KV Binding

```toml
[[kv_namespaces]]
binding = "DATA"
id = "YOUR_KV_ID"
```
