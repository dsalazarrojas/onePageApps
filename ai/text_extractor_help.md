# Text Extractor

## What it does
Extract text from images using OCR technology. After deployment, it exposes the routes listed below, starting with `GET /`.

## What you need
- Cloudflare API Token to deploy and update the worker from the app.
- Cloudflare Account ID for the Workers account that will host the app.
- OPENAI_API_KEY for the live AI request this template makes.

## Configuration fields
| Field | Description | Example |
|-------|-------------|---------|
| imageData | Base64-encoded image payload sent to the worker. | Upload image with text |

## Live app endpoints
| Path | What it does |
|------|-------------|
| GET / | Shows the OCR/text-extraction UI. |
| POST / | Returns extracted text, structure hints, and confidence data. |

## Tips & limits
- Cloudflare Workers free tier: plan around request quotas and tight per-request CPU budgets on the free plan.
- OCR accuracy depends heavily on scan quality, contrast, and image resolution.

## Example embed code
```html
<iframe src="https://your-worker.workers.dev" width="100%" height="500" frameborder="0"></iframe>
```
