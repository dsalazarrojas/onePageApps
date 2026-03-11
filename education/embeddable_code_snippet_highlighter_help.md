# Embeddable Code Snippet Highlighter

## What it does
Creates a reusable browser-side snippet widget with syntax highlighting, optional line numbers, wrapping, and copy-to-clipboard support.

## What you need
- Cloudflare API Token to deploy and update the worker from the app.
- Cloudflare Account ID for the Workers account that will host the app.

## Live app endpoints
| Path | What it does |
|------|-------------|
| GET / | Demo/configuration page with live preview and generated embed code |
| GET /widget.js | Embeddable widget loader script |

## Embed configuration
The generated script uses URL-encoded JSON in `data-config`.

```json
{
  "title": "REST API Example",
  "language": "javascript",
  "theme": "dark",
  "lineNumbers": true,
  "wrap": false,
  "code": "function hello() { return 'world'; }"
}
```
