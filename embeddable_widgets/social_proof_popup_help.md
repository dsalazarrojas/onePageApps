# Social Proof Popup

Displays recent purchase/signup events as bottom-left toast popups. Events stored in KV with 7-day TTL.

## Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/` | Live demo UI with popup cycling |
| GET | `/events?limit=N` | Fetch recent events (max 50) |
| POST | `/events` | Record a new event |

## POST /events

```json
{ "name": "Alice", "action": "purchased", "item": "Pro Plan", "location": "London" }
```

## KV Binding

```toml
[[kv_namespaces]]
binding = "DATA"
id = "YOUR_KV_ID"
```

Events expire after 7 days automatically.
