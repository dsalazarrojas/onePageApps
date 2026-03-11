# Image Metadata Viewer & Stripper

## What it does
Upload an image to inspect its embedded metadata, including dimensions, file size, MIME type, last modified date, and basic EXIF fields parsed from JPEG headers, then optionally strip all metadata by re-encoding the image through canvas. After deployment, it exposes the routes listed below, starting with `GET /`.

## What you need
- Cloudflare API Token to deploy and update the worker from the app.
- Cloudflare Account ID for the Workers account that will host the app.

## Configuration fields
| Field | Description | Example |
|-------|-------------|---------|
| None | No server-side configuration is required. | n/a |

## Live app endpoints
| Path | What it does |
|------|-------------|
| GET / | Shows the metadata viewer/stripper UI. |

## Tips & limits
- Cloudflare Workers free tier: plan around request quotas and tight per-request CPU budgets on the free plan.
- All inspection and metadata stripping happen locally in the browser, so uploaded images never leave the user's device.
- Stripping re-encodes through canvas, which removes EXIF data; JPEG files may contain GPS data that stripping will remove, while PNG files usually carry minimal metadata.

## Example embed code
```html
<iframe src="https://your-worker.workers.dev" width="100%" height="600" frameborder="0"></iframe>
```
