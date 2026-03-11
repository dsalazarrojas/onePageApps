# Document Converter

## What it does
Convert between document formats. After deployment, the main live route is `POST /`.

## What you need
- Cloudflare API Token to deploy and update the worker from the app.
- Cloudflare Account ID for the Workers account that will host the app.

## Configuration fields
| Field | Description | Example |
|-------|-------------|---------|
| markdown | Markdown source content to convert. | Enter markdown content... |
| outputFormat | Target output type the worker should return. | html or pdf |

## Live app endpoints
| Path | What it does |
|------|-------------|
| POST / | Converts Markdown input into HTML or a PDF-oriented response payload. |

## Tips & limits
- Cloudflare Workers free tier: plan around request quotas and tight per-request CPU budgets on the free plan.
- HTML conversion works immediately; polished PDF output usually needs an external rendering service.

## Example embed code
```html
<iframe src="https://your-worker.workers.dev" width="100%" height="500" frameborder="0"></iframe>
```
