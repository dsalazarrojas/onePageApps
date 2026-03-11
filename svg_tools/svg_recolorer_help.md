# SVG Recolorer

## What it does
Upload an SVG file, automatically extract all unique fill and stroke colors used, swap them with new colors using a visual color-picker palette, preview the result, and download the recolored SVG. After deployment, it exposes the routes listed below, starting with `GET /`.

## What you need
- Cloudflare API Token to deploy and update the worker from the app.
- Cloudflare Account ID for the Workers account that will host the app.

## Configuration fields
| Field | Description | Example |
|-------|-------------|---------|
| None | No server-side fields are required; all recoloring options are chosen in the browser UI. | N/A |

## Live app endpoints
| Path | What it does |
|------|-------------|
| GET / | Shows the SVG recolorer UI. |

## Tips & limits
- Cloudflare Workers free tier: plan around request quotas and tight per-request CPU budgets on the free plan.
- All processing happens in the browser; colors must be hex (`#rrggbb`) or supported named CSS colors to be detected, and both inline styles and presentation attributes are scanned.

## Example embed code
```html
<iframe src="https://your-worker.workers.dev" width="100%" height="600" frameborder="0"></iframe>
```
