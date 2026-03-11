# Embeddable Feedback Form

Collect star ratings and comments. Responses stored in KV (DATA binding).

## Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/` | Feedback form UI |
| POST | `/submit` | Submit feedback |
| GET | `/responses` | List all responses (latest 200) |

## POST /submit

```json
{ "rating": 5, "comment": "Great product!", "page": "https://example.com/product" }
```

## Webhook (optional)

Set `WEBHOOK_URL` secret to receive a POST for each new submission.

## KV Binding

```toml
[[kv_namespaces]]
binding = "DATA"
id = "YOUR_KV_ID"
```
