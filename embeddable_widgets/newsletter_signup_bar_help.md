# Newsletter Signup Bar

A sticky bottom-of-page signup bar that can be dropped onto any site via a `<script>` tag.

## Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/` | Demo page |
| POST | `/subscribe` | Subscribe an email |
| GET | `/subscribers` | List all subscribers |
| GET | `/embed.js` | Embeddable script tag |

## Embed

```html
<script src="https://YOUR_WORKER.workers.dev/embed.js"></script>
```

## POST /subscribe

```json
{ "email": "user@example.com" }
```

## Webhook (optional)

Set `WEBHOOK_URL` secret to receive a POST for each new subscriber.

## KV Binding

```toml
[[kv_namespaces]]
binding = "DATA"
id = "YOUR_KV_ID"
```
