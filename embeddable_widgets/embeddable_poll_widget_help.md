# Embeddable Poll Widget

Single or multi-poll widget with KV-backed vote counts.

## Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/` | Interactive poll UI |
| GET | `/poll?id=ID` | Get poll definition |
| POST | `/poll` | Create or replace a poll |
| POST | `/vote` | Cast a vote |
| GET | `/results?id=ID` | Get results with percentages |

## POST /poll

```json
{ "id": "fav-color", "question": "Favorite color?", "options": ["Red","Blue","Green"] }
```

## POST /vote

```json
{ "pollId": "fav-color", "option": "Blue" }
```

## KV Binding

```toml
[[kv_namespaces]]
binding = "DATA"
id = "YOUR_KV_ID"
```
