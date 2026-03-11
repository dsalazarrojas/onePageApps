# Embeddable Keyboard Shortcuts Cheat Sheet

## What it does
Builds a searchable keyboard-shortcuts reference widget from grouped JSON data.

## What you need
- Cloudflare API Token to deploy and update the worker from the app.
- Cloudflare Account ID for the Workers account that will host the app.

## Live app endpoints
| Path | What it does |
|------|-------------|
| GET / | Demo/configuration page with JSON editor, live preview, and generated embed code |
| GET /widget.js | Embeddable widget loader script |

## Embed configuration
The generated script expects URL-encoded JSON in `data-config`.

```json
{
  "title": "Productivity shortcuts",
  "platform": "macOS + Windows",
  "accent": "#2563eb",
  "groups": [
    {
      "title": "Navigation",
      "items": [
        { "action": "Command palette", "shortcut": "⌘ K", "note": "Open global actions." }
      ]
    }
  ]
}
```
