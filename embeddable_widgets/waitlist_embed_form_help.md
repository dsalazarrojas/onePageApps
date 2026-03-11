# Waitlist Embed Form

Minimal waitlist signup with position number. KV-backed (DATA binding).

## Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/` | Signup page |
| POST | `/join` | Join the waitlist |
| GET | `/count` | Current signup count |
| GET | `/list` | All entries (admin) |

## POST /join

```json
{ "email": "user@example.com", "name": "Alice" }
```

Returns position number on success.

## Webhook (optional)

Set `WEBHOOK_URL` secret to receive a POST for each new signup.

## KV Binding

```toml
[[kv_namespaces]]
binding = "DATA"
id = "YOUR_KV_ID"
```
