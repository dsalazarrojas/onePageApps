# Embeddable Unit Converter Widget

## What it does
Generates a browser-side measurement converter widget covering length, mass, temperature, volume, and speed.

## What you need
- Cloudflare API Token to deploy and update the worker from the app.
- Cloudflare Account ID for the Workers account that will host the app.

## Live app endpoints
| Path | What it does |
|------|-------------|
| GET / | Demo/configuration page with live preview and generated script tag |
| GET /widget.js | Embeddable widget loader script |

## Embed configuration
The generated widget accepts URL-encoded JSON in `data-config`.

```json
{
  "title": "Operations unit converter",
  "accent": "#2563eb",
  "defaultCategory": "length"
}
```
