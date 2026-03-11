# Share Buttons Custom

Embeddable share buttons (X/Twitter, Facebook, LinkedIn, Email, Copy) with KV-backed click tracking.

## Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/` | Demo UI |
| POST | `/track` | Record a share click |
| GET | `/stats` | Aggregate share stats |
| GET | `/widget.js` | Embeddable widget script |

## Embed

```html
<div id="share-buttons"></div>
<script>window.ShareButtons = { url: 'https://example.com/article', title: 'My Article' };</script>
<script src="https://YOUR_WORKER.workers.dev/widget.js"></script>
```

## KV Binding

```toml
[[kv_namespaces]]
binding = "DATA"
id = "YOUR_KV_ID"
```
