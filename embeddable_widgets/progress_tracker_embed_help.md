# Progress Tracker Embed

Track goals with animated progress bars. State persisted in KV (DATA binding).

## Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/` | Progress tracker UI |
| GET | `/goals` | List all goals |
| POST | `/goals` | Create or update a goal |
| DELETE | `/goals` | Delete a goal by id |

## POST /goals

```json
{ "label": "Run 100km", "current": 42, "target": 100, "unit": "km", "color": "#6366f1" }
```

Include `"id"` to update an existing goal.

## KV Binding

```toml
[[kv_namespaces]]
binding = "DATA"
id = "YOUR_KV_ID"
```
