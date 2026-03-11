# Donation Progress Bar

Animated fundraising progress bar with KV-backed totals and donor history.

## Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/` | Dashboard UI |
| GET | `/stats` | Get current stats |
| POST | `/donate` | Record a donation |
| POST | `/config` | Set goal/title/currency |
| GET | `/widget.js` | Embeddable widget |

## POST /donate

```json
{ "amount": 25.00, "name": "Alice", "message": "Keep it up!" }
```

## Embed

```html
<div id="donation-widget"></div>
<script src="https://YOUR_WORKER.workers.dev/widget.js"></script>
```

## Webhook (optional)

Set `WEBHOOK_URL` secret to receive a POST for each donation.

## KV Binding

```toml
[[kv_namespaces]]
binding = "DATA"
id = "YOUR_KV_ID"
```
