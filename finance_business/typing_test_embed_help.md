# Typing Test Embed

60-second typing speed test with WPM calculation, accuracy tracking, and KV-backed leaderboard.

## Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/` | Typing test UI |
| GET | `/texts` | Get passage list |
| POST | `/texts` | Add a custom passage |
| POST | `/score` | Submit a score |
| GET | `/leaderboard` | Top 20 scores |

## POST /score

```json
{ "name": "Alice", "wpm": 72, "accuracy": 97 }
```

## KV Binding

```toml
[[kv_namespaces]]
binding = "DATA"
id = "YOUR_KV_ID"
```

Top 100 scores are persisted; leaderboard shows top 20.
