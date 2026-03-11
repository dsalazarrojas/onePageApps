# SVG Optimizer

## What it does
Upload an SVG file and strip unnecessary markup — comments, metadata elements, editor-specific namespaces, whitespace, and default presentation attributes — to reduce file size. Shows a before/after size comparison and lets you download the optimized result. After deployment, it exposes the routes listed below, starting with `GET /`.

## What you need
- Cloudflare API Token to deploy and update the worker from the app.
- Cloudflare Account ID for the Workers account that will host the app.

## Configuration fields
| Field | Description | Example |
|-------|-------------|---------|
| None | No server-side fields are required; all optimization options are selected in the browser UI. | N/A |

## Live app endpoints
| Path | What it does |
|------|-------------|
| GET / | Shows the SVG optimizer UI. |

## Tips & limits
- Cloudflare Workers free tier: plan around request quotas and tight per-request CPU budgets on the free plan.
- All processing happens in the browser, optimization is lossless for visual output, and Illustrator/Inkscape exports often shrink by roughly 20–60%.

## Example embed code
```html
<iframe src="https://your-worker.workers.dev" width="100%" height="600" frameborder="0"></iframe>
```
