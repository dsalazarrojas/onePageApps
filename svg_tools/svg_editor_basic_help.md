# SVG Editor

## What it does
Upload an SVG file and interactively edit element attributes such as fill color, stroke color, stroke width, and text content, then download the modified SVG. After deployment, it exposes the routes listed below, starting with `GET /`.

## What you need
- Cloudflare API Token to deploy and update the worker from the app.
- Cloudflare Account ID for the Workers account that will host the app.

## Configuration fields
| Field | Description | Example |
|-------|-------------|---------|
| None | No server-side configuration is required. | n/a |

## Live app endpoints
| Path | What it does |
|------|-------------|
| GET / | Shows the SVG editor UI. |

## Tips & limits
- Cloudflare Workers free tier: plan around request quotas and tight per-request CPU budgets on the free plan.
- All SVG processing happens in the browser, and the editor lists supported shape and text elements found in the uploaded file.
- Changes are applied directly to the parsed SVG source, so downloaded files preserve the updated XML structure.

## Example embed code
```html
<iframe src="https://your-worker.workers.dev" width="100%" height="600" frameborder="0"></iframe>
```
