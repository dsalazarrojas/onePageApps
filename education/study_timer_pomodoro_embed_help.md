# Study Timer Pomodoro Embed

Pomodoro-style timer that logs completed sessions to KV.

## Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/` | Timer UI |
| POST | `/log` | Log a completed session |
| GET | `/stats?days=N` | Work minutes by day (max 30 days) |

## POST /log

```json
{ "type": "work", "minutes": 25, "label": "Writing chapter 3" }
```

`type` is `work`, `short`, or `long`.

## KV Binding

Sessions expire after 90 days automatically.

```toml
[[kv_namespaces]]
binding = "DATA"
id = "YOUR_KV_ID"
```
