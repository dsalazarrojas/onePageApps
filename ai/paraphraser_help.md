# Paraphraser

## What it does
Generate paraphrased variations at different creativity levels. After deployment, it exposes the routes listed below, starting with `GET /`.

## What you need
- Cloudflare API Token to deploy and update the worker from the app.
- Cloudflare Account ID for the Workers account that will host the app.
- OPENAI_API_KEY for the live AI request this template makes.

## Configuration fields
| Field | Description | Example |
|-------|-------------|---------|
| sourceText | Primary source text the worker analyzes before generating a result. | Enter text to paraphrase... |
| variations | Controls the number of variations setting for this worker. | 3 |

## Live app endpoints
| Path | What it does |
|------|-------------|
| GET / | Shows the paraphrasing UI. |
| POST / | Returns one or more paraphrased variations as JSON. |

## Tips & limits
- Cloudflare Workers free tier: plan around request quotas and tight per-request CPU budgets on the free plan.
- Higher variation settings produce more creative rewrites but can drift farther from the original meaning.

## Example embed code
```html
<iframe src="https://your-worker.workers.dev" width="100%" height="500" frameborder="0"></iframe>
```
