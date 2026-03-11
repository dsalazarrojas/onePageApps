# Robots.txt Live Tester
## What it does
Fetches a `robots.txt` file via the worker and tests whether a given URL path is allowed or disallowed for a specified user-agent.
## Endpoints
| Path | Method | Description |
|------|--------|-------------|
| `GET /` | GET | Testing UI |
| `GET /widget.js` | GET | Iframe injector |
| `POST /test` | POST | Body: `{robotsUrl, testUrl, userAgent}` → `{allowed, matchedRule}` |
## Embed
```html
<script src="https://your-worker.workers.dev/widget.js"></script>
```
## Tips
- Stateless – no bindings required.
- Handles simple Allow/Disallow rules. Does not parse Sitemap or Crawl-delay directives.
