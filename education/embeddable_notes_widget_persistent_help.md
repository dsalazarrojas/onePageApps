# Embeddable Notes Widget (Persistent)

Full-featured notes app with title, tags, and full content, all stored in KV.

## Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/` | Notes UI |
| GET | `/notes` | List all notes |
| GET | `/notes?tag=TAG` | Filter by tag |
| POST | `/notes` | Create or update note |
| DELETE | `/notes` | Delete by id |

## POST /notes

```json
{ "title": "Meeting notes", "content": "...", "tags": ["work","2025"] }
```

Include `"id"` to update an existing note.

## KV Binding

```toml
[[kv_namespaces]]
binding = "DATA"
id = "YOUR_KV_ID"
```
