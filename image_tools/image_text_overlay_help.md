# Image Text Overlay

## What it does
Upload a local image and add customizable text overlays, then download the result. After deployment, it exposes the routes listed below, starting with `GET /`.

## What you need
- Cloudflare API Token to deploy and update the worker from the app.
- Cloudflare Account ID for the Workers account that will host the app.

## Configuration fields
| Field | Description | Example |
|-------|-------------|---------|
| None | No server-side configuration is required because all image editing runs in the browser. | n/a |

## Live app endpoints
| Path | What it does |
|------|-------------|
| GET / | Shows the Image Text Overlay UI. |

## Tips & limits
- Cloudflare Workers free tier: plan around request quotas and tight per-request CPU budgets on the free plan.
- All processing runs in the browser, supports multiple text layers, and contrasting fill/stroke colors improve readability.

## Example embed code
```html
<iframe src="https://your-worker.workers.dev" width="100%" height="600" frameborder="0"></iframe>
```
