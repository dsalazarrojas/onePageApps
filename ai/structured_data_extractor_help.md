# Structured Data Extractor

## What it does
Extract structured JSON from unstructured text. After deployment, it exposes the routes listed below, starting with `GET /`.

## What you need
- Cloudflare API Token to deploy and update the worker from the app.
- Cloudflare Account ID for the Workers account that will host the app.
- OPENAI_API_KEY for the live AI request this template makes.

## Configuration fields
| Field | Description | Example |
|-------|-------------|---------|
| sourceText | Primary source text the worker analyzes before generating a result. | Paste unstructured text... |
| schemaHint | Optional description of the JSON structure you want back. | Describe the structure you want... |

## Live app endpoints
| Path | What it does |
|------|-------------|
| GET / | Shows the structured-data extraction UI. |
| POST / | Returns JSON extracted from the submitted text. |

## Tips & limits
- Cloudflare Workers free tier: plan around request quotas and tight per-request CPU budgets on the free plan.
- Supplying a clear schema hint usually produces more stable JSON keys and shapes.

## Example embed code
```html
<iframe src="https://your-worker.workers.dev" width="100%" height="500" frameborder="0"></iframe>
```
