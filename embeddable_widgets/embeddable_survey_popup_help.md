# Embeddable Survey Popup

A popup survey that appears after a configurable delay. Responses tallied in KV.

## Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/` | Admin UI |
| GET | `/survey` | Get current survey |
| POST | `/survey` | Set survey config |
| POST | `/respond` | Submit a response |
| GET | `/results` | View results |
| GET | `/popup.js` | Embeddable popup script |

## Embed

```html
<script>window.SurveyPopup = { delay: 5 };</script>
<script src="https://YOUR_WORKER.workers.dev/popup.js"></script>
```

## KV Binding

```toml
[[kv_namespaces]]
binding = "DATA"
id = "YOUR_KV_ID"
```
