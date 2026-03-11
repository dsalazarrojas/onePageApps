# Image Cropper

## What it does
Upload a local image and drag to select a crop region on an interactive canvas. After deployment, it exposes the routes listed below, starting with `GET /`.

## What you need
- Cloudflare API Token to deploy and update the worker from the app.
- Cloudflare Account ID for the Workers account that will host the app.

## Configuration fields
| Field | Description | Example |
|-------|-------------|---------|
| No server-side fields | All processing is client-side. | — |

## Live app endpoints
| Path | What it does |
|------|-------------|
| GET / | Shows the image cropper UI. |

## Tips & limits
- Cloudflare Workers free tier: plan around request quotas and tight per-request CPU budgets on the free plan.
- All processing happens in the browser; no image data is sent to the server.
- Very large images (>20 MP) may be slow to render depending on the browser.

## Example embed code
```html
<iframe src="https://your-worker.workers.dev" width="100%" height="600" frameborder="0"></iframe>
```
