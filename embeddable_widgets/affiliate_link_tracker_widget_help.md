# Affiliate Link Tracker Widget

Create short redirect links and track click counts via KV.

## Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/` | Dashboard UI |
| GET | `/links` | List all links with click counts |
| POST | `/links` | Add a tracked link |
| DELETE | `/links` | Remove a link |
| GET | `/go?id=ID` | Redirect + increment counter |
| GET | `/stats` | Raw click counts |

## POST /links

```json
{ "id": "product1", "label": "Main product", "destination": "https://example.com/product" }
```

## Redirect usage

```
https://YOUR_WORKER.workers.dev/go?id=product1
```

## KV Binding

```toml
[[kv_namespaces]]
binding = "DATA"
id = "YOUR_KV_ID"
```
