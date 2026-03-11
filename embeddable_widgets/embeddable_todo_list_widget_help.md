# Embeddable Todo List Widget

Named todo lists with KV persistence. Supports multiple independent lists.

## Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/` | Todo UI |
| GET | `/todos?list=NAME` | Get todos for a list |
| POST | `/todos` | Add a todo |
| PATCH | `/todos` | Update (done/text) |
| DELETE | `/todos` | Delete by id |

## POST /todos

```json
{ "list": "shopping", "text": "Buy milk" }
```

## PATCH /todos

```json
{ "list": "shopping", "id": "abc123", "done": true }
```

## KV Binding

```toml
[[kv_namespaces]]
binding = "DATA"
id = "YOUR_KV_ID"
```
