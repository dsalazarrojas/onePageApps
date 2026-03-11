# Simple Live Chat Widget

A KV-backed live chat room with polling-based updates. Up to 200 messages per room are persisted.

## Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/` | Chat demo UI |
| GET | `/messages?room=NAME` | Fetch last 100 messages |
| POST | `/messages` | Post a new message |
| POST | `/clear` | Clear all messages in a room |

## POST /messages body

```json
{ "room": "support", "author": "Alice", "text": "Hello!" }
```

## KV Binding

```toml
[[kv_namespaces]]
binding = "DATA"
id = "YOUR_KV_ID"
```

## Embed

Embed the UI inside an `<iframe>` or call the JSON endpoints directly from any frontend.
Rooms are isolated by name. Alphanumeric + `_-` only; max 40 chars.
