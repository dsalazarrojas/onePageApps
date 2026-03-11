# SVG to Image Converter

## What it does
Upload an SVG file, render it to a canvas, and download it as a PNG or JPEG image. Supports custom output dimensions and background color. After deployment, it exposes the routes listed below, starting with `GET /`.

## What you need
- Cloudflare API Token to deploy and update the worker from the app.
- Cloudflare Account ID for the Workers account that will host the app.

## Configuration fields
| Field | Description | Example |
|-------|-------------|---------|
| None | No server-side fields are required; output format, size, quality, and background color are chosen in the browser UI. | N/A |

## Live app endpoints
| Path | What it does |
|------|-------------|
| GET / | Shows the SVG to image converter UI. |

## Tips & limits
- Cloudflare Workers free tier: plan around request quotas and tight per-request CPU budgets on the free plan.
- All processing happens in the browser; SVGs with external references may not render correctly, and setting a background color is especially helpful when exporting JPEG files.

## Example embed code
```html
<iframe src="https://your-worker.workers.dev" width="100%" height="600" frameborder="0"></iframe>
```
