# Glassmorphism Generator

## What it does
Create frosted-glass card styles with blur, transparency, border strength, and layered background effects.

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
