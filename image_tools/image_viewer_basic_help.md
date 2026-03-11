# Image Viewer

## What it does
Upload and view images with zoom, pan, and file information. Supports drag-and-drop of multiple images with a thumbnail strip. After deployment, it exposes the routes listed below, starting with `GET /`.

## What you need
- Cloudflare API Token to deploy and update the worker from the app.
- Cloudflare Account ID for the Workers account that will host the app.

## Configuration fields
| Field | Description | Example |
|-------|-------------|---------|
| None | No server-side configuration is required because image viewing happens entirely in the browser. | n/a |

## Live app endpoints
| Path | What it does |
|------|-------------|
| GET / | Shows the Image Viewer UI. |

## Tips & limits
- Cloudflare Workers free tier: plan around request quotas and tight per-request CPU budgets on the free plan.
- All processing runs in the browser, keyboard shortcuts for zoom are + / - / 0, and clicking a thumbnail switches the active image.

## Example embed code
```html
<iframe src="https://your-worker.workers.dev" width="100%" height="600" frameborder="0"></iframe>
```
