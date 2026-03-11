# Video Compressor

## What it does
Compress videos using cloud services. After deployment, the main live route is `POST /`.

## What you need
- Cloudflare API Token to deploy and update the worker from the app.
- Cloudflare Account ID for the Workers account that will host the app.

## Configuration fields
| Field | Description | Example |
|-------|-------------|---------|
| videoData | Base64-encoded video payload sent to the compressor workflow. | Upload video file |
| quality | Compression or quality level passed to the worker. | low, medium, high |

## Live app endpoints
| Path | What it does |
|------|-------------|
| POST / | Accepts video data and returns a compression-plan response payload. |

## Tips & limits
- Cloudflare Workers free tier: plan around request quotas and tight per-request CPU budgets on the free plan.
- This worker currently describes a compression plan; bind a media service before promising production video exports.

## Example embed code
```html
<iframe src="https://your-worker.workers.dev" width="100%" height="500" frameborder="0"></iframe>
```
