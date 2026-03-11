# Screenshot Annotator

## What it does
Upload a screenshot or image and annotate it with shapes, arrows, text, and freehand drawings, then download the annotated result. After deployment, it exposes the routes listed below, starting with `GET /`.

## What you need
- Cloudflare API Token to deploy and update the worker from the app.
- Cloudflare Account ID for the Workers account that will host the app.

## Configuration fields
| Field | Description | Example |
|-------|-------------|---------|
| None | No server-side fields are required because all annotation work happens in the browser. | n/a |

## Live app endpoints
| Path | What it does |
|------|-------------|
| GET / | Shows the screenshot annotator UI. |

## Tips & limits
- Cloudflare Workers free tier: plan around request quotas and tight per-request CPU budgets on the free plan.
- All processing happens in the browser, the undo button removes the most recent annotation, and PNG export preserves every visible annotation.

## Example embed code
```html
<iframe src="https://your-worker.workers.dev" width="100%" height="600" frameborder="0"></iframe>
```
