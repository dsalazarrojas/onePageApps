# Box Shadow Generator

## What it does
Dial in offsets, blur, spread, color, inset mode, and opacity while previewing the resulting box-shadow CSS.

## What you need
- Cloudflare API Token to deploy and update the worker from the app.
- Cloudflare Account ID for the Workers account that will host the app.

## Configuration fields
| Field | Description | Example |
|-------|-------------|---------|
| — | No pre-deployment configuration fields required. | — |

## Live app endpoints
| Path | What it does |
|------|-------------|
| GET / | Serves the interactive browser-based tool. |

## Tips & limits
- All generation happens client-side in the browser after the page loads.
- Copy the generated CSS/HTML output into your project after you are happy with the preview.

## Example embed code
```html
<iframe src="https://your-worker.workers.dev" width="100%" height="720" frameborder="0"></iframe>
```
