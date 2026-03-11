# Image Analysis

## What it does
Analyze images with AI for descriptions and insights. After deployment, the main live route is `POST /`.

## What you need
- Cloudflare API Token to deploy and update the worker from the app.
- Cloudflare Account ID for the Workers account that will host the app.
- OPENAI_API_KEY for the live AI request this template makes.

## Configuration fields
| Field | Description | Example |
|-------|-------------|---------|
| imageData | Base64-encoded image payload sent to the worker. | Upload image for analysis |
| analysisType | Select whether the worker should describe, OCR, or inspect objects in the image. | description, alt-text, objects |

## Live app endpoints
| Path | What it does |
|------|-------------|
| POST / | Accepts base64 image data and returns the requested visual analysis. |

## Tips & limits
- Cloudflare Workers free tier: plan around request quotas and tight per-request CPU budgets on the free plan.
- Large base64 images increase request size, latency, and model cost.

## Example embed code
```html
<iframe src="https://your-worker.workers.dev" width="100%" height="500" frameborder="0"></iframe>
```
