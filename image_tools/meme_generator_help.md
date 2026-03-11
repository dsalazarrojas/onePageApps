# Meme Generator

## What it does
Upload a custom image or use one of the built-in template backgrounds, add top and bottom meme text, then download the result. After deployment, it exposes the routes listed below, starting with `GET /`.

## What you need
- Cloudflare API Token to deploy and update the worker from the app.
- Cloudflare Account ID for the Workers account that will host the app.

## Configuration fields
| Field | Description | Example |
|-------|-------------|---------|
| None | No server-side fields are required because all meme editing happens in the browser. | n/a |

## Live app endpoints
| Path | What it does |
|------|-------------|
| GET / | Shows the meme generator UI. |

## Tips & limits
- Cloudflare Workers free tier: plan around request quotas and tight per-request CPU budgets on the free plan.
- All processing happens in the browser, Impact font gives the classic meme look, and white text with a black outline is the default style.

## Example embed code
```html
<iframe src="https://your-worker.workers.dev" width="100%" height="600" frameborder="0"></iframe>
```
