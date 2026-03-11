# Embeddable Visitor Counter

A lightweight Cloudflare Worker that tracks page view counts using **KV storage** (DATA binding).

## Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/` | Interactive demo UI |
| POST | `/count` | Increment and return count for a page |
| GET | `/stats?page=NAME` | Read current count without incrementing |

## POST /count

```json
{ "page": "home" }
```

Response:
```json
{ "page": "home", "count": 42 }
```

## Embed snippet

```html
<script>
  fetch('https://YOUR_WORKER.workers.dev/count', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ page: location.pathname })
  })
  .then(r => r.json())
  .then(d => console.log('views', d.count));
</script>
```

## KV Binding

Bind your KV namespace as **DATA** in your `wrangler.toml`:

```toml
[[kv_namespaces]]
binding = "DATA"
id = "YOUR_KV_ID"
```
