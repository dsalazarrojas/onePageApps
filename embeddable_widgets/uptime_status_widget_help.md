# Uptime Status Widget

## What it does
Pings a public URL on load and renders a compact live status badge with HTTP status and response time.

## Endpoints
| Path | Method | Description |
|------|--------|-------------|
| `GET /` | GET | Live badge builder and preview |
| `GET /status` | GET | Stateless uptime check endpoint |
| `GET /widget.js` | GET | Host-page badge injector |

## Embed
```html
<script src="https://your-worker.workers.dev/widget.js"
  data-url="https://example.com/health"
  data-label="API status"
  data-refresh="60">
</script>
```

## Tips
- Target a publicly reachable HTTP(S) URL.
- The widget uses `HEAD` first and falls back to `GET` when needed.
