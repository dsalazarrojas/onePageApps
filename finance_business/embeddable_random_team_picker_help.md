# Embeddable Random Team Picker

Randomly divides a saved member pool into N teams. Pool and pick history stored in KV.

## Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/` | Team picker UI |
| GET | `/pool?id=ID` | Get member pool |
| POST | `/pool` | Save member pool |
| POST | `/pick` | Pick teams from pool |
| GET | `/history?id=ID` | Past team draws |

## POST /pool

```json
{ "id": "dev-team", "members": ["Alice","Bob","Charlie","Diana"] }
```

## POST /pick

```json
{ "id": "dev-team", "teams": 2 }
```

## KV Binding

```toml
[[kv_namespaces]]
binding = "DATA"
id = "YOUR_KV_ID"
```
