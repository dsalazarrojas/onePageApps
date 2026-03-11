# XML Formatter / Beautifier

## What it does
Beautifies XML with 2-space indentation, minifies extra whitespace between tags, and validates XML well-formedness entirely in the browser.

## What you need
- Cloudflare API Token to deploy and update the worker from the app.
- Cloudflare Account ID for the Workers account that will host the app.

## Configuration fields
| Field | Description | Example |
|-------|-------------|---------|
| — | No configuration fields required. | — |

## Live app endpoints
| Path | What it does |
|------|-------------|
| GET / | Shows the XML Formatter / Beautifier UI. |

## Tips & limits
- Cloudflare Workers free tier: plan around request quotas and tight per-request CPU budgets on the free plan.
- Very large XML documents are parsed in-browser, so malformed multi-megabyte inputs may feel slow on low-powered devices.

## Example embed code
```html
<iframe src="https://your-worker.workers.dev" width="100%" height="600" frameborder="0"></iframe>
```
