# Concept Map Generator Lite

## What it does
Turns a lightweight edge-list format into an SVG concept map in the browser.

## What you need
- Cloudflare API Token to deploy and update the worker from the app.
- Cloudflare Account ID for the Workers account that will host the app.

## Live app endpoints
| Path | What it does |
|------|-------------|
| GET / | Interactive concept-map builder and SVG preview |

## Input format
Use one relation per line:

```text
Source -> Target | Optional label
Metrics -> Strategy | refines
```
