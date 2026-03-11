# Embeddable Periodic Table

## What it does
Provides a searchable periodic-table widget with category colors, a classic grid layout, and click-to-view element details.

## What you need
- Cloudflare API Token to deploy and update the worker from the app.
- Cloudflare Account ID for the Workers account that will host the app.

## Live app endpoints
| Path | What it does |
|------|-------------|
| GET / | Demo/configuration page with live preview |
| GET /widget.js | Embeddable widget loader script |

## Embed configuration

```json
{
  "title": "Periodic table explorer",
  "accent": "#2563eb"
}
```
