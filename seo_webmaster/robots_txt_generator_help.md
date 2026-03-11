# Robots.txt Generator

## What it does
Compose allow rules, disallow rules, crawl delay, and sitemap references for a quick robots.txt draft.

## What you need
- Cloudflare API Token to deploy and update the worker from the app.
- Cloudflare Account ID for the Workers account that will host the app.

## Configuration fields
| Field | Description | Example |
|-------|-------------|---------|
| — | No pre-deployment configuration fields required. | — |

## Live app endpoints
| Path | What it does |
|------|-------------|
| GET / | Serves the interactive browser-based tool. |

## Tips & limits
- All logic runs client-side after the page loads.
- Copy the generated output into your project after reviewing the preview.

## Example embed code
```html
<iframe src="https://your-worker.workers.dev" width="100%" height="720" frameborder="0"></iframe>
```
