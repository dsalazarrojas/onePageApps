# Timeline Builder Embed

## What it does
Builds a vertical timeline from JSON event data and exposes a small embeddable widget loader script.

## What you need
- Cloudflare API Token to deploy and update the worker from the app.
- Cloudflare Account ID for the Workers account that will host the app.

## Live app endpoints
| Path | What it does |
|------|-------------|
| GET / | Demo/configuration page with live preview |
| GET /widget.js | Embeddable widget loader script |

## Event format

```json
[
  {
    "date": "2026-03-15",
    "title": "Beta release",
    "tag": "Launch",
    "description": "Invited pilot customers and collected onboarding feedback."
  }
]
```
