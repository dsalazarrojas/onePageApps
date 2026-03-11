# Image Collage Maker

## What it does
Upload multiple images and arrange them into a grid collage, then download the result. After deployment, it exposes the routes listed below, starting with `GET /`.

## What you need
- Cloudflare API Token to deploy and update the worker from the app.
- Cloudflare Account ID for the Workers account that will host the app.

## Configuration fields
| Field | Description | Example |
|-------|-------------|---------|
| None | No server-side fields are required because all collage building happens in the browser. | n/a |

## Live app endpoints
| Path | What it does |
|------|-------------|
| GET / | Shows the image collage maker UI. |

## Tips & limits
- Cloudflare Workers free tier: plan around request quotas and tight per-request CPU budgets on the free plan.
- All processing happens in the browser, you can upload up to 9 images, and preset grid layouts make it easy to build square-cell collages quickly.

## Example embed code
```html
<iframe src="https://your-worker.workers.dev" width="100%" height="600" frameborder="0"></iframe>
```
