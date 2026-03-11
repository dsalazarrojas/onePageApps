# Embeddable Calendar Picker

Interactive monthly calendar with KV-backed events.

## Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/` | Calendar UI |
| GET | `/events?month=YYYY-MM` | List events for a month |
| POST | `/events` | Add an event |
| DELETE | `/events` | Delete event by id |

## POST /events

```json
{ "date": "2025-06-15", "title": "Team standup", "note": "Via Zoom", "color": "#6366f1" }
```

## KV Binding

```toml
[[kv_namespaces]]
binding = "DATA"
id = "YOUR_KV_ID"
```
