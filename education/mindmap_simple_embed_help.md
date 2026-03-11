# Mindmap Simple Embed

## What it does
Turns an indented outline into an embeddable SVG mindmap rendered entirely in the browser.

## What you need
- Cloudflare API Token to deploy and update the worker from the app.
- Cloudflare Account ID for the Workers account that will host the app.

## Live app endpoints
| Path | What it does |
|------|-------------|
| GET / | Demo/configuration page with outline editor and live preview |
| GET /widget.js | Embeddable widget loader script |

## Outline format
Use the first line as the root node and indent child nodes with two spaces:

```text
Launch plan
  Messaging
    Release notes
```
