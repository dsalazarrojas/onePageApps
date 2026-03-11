# Image Optimizer

## What it does
Compress and optimize images. After deployment, the main live route is `POST /`.

## What you need
- Cloudflare API Token to deploy and update the worker from the app.
- Cloudflare Account ID for the Workers account that will host the app.

## Configuration fields
| Field | Description | Example |
|-------|-------------|---------|
| imageData | Base64-encoded image payload sent to the worker. | Upload image file |
| quality | Compression or quality level passed to the worker. | 0.8 |

## Live app endpoints
| Path | What it does |
|------|-------------|
| POST / | Accepts image data and returns an optimization-ready response payload. |

## Tips & limits
- Cloudflare Workers free tier: plan around request quotas and tight per-request CPU budgets on the free plan.
- The current worker is an optimization scaffold; plug in a real image service if you need production-grade compression.

## Example embed code
```html
<iframe src="https://your-worker.workers.dev" width="100%" height="500" frameborder="0"></iframe>
```
