# Poll Survey Creator

## What it does
Create interactive surveys and collect responses. After deployment, it exposes the routes listed below, starting with `GET /`.

## What you need
- Cloudflare API Token to deploy and update the worker from the app.
- Cloudflare Account ID for the Workers account that will host the app.
- SURVEY_CONFIG environment value describing the survey questions.
- SURVEY_KV binding if you want stored responses and result pages.

## Configuration fields
| Field | Description | Example |
|-------|-------------|---------|
| title | Title displayed above the public survey. | Customer Satisfaction Survey |
| questions | Survey questions entered one per line. | What do you think about our service? |

## Live app endpoints
| Path | What it does |
|------|-------------|
| GET / | Shows the public survey form. |
| POST /submit | Stores a response submission. |
| GET /results | Shows aggregated survey results. |

## Tips & limits
- Cloudflare Workers free tier: plan around request quotas and tight per-request CPU budgets on the free plan.
- KV-backed templates should also account for free-tier read/write quotas and eventual consistency on repeated reads.
- Each response writes to KV, so heavy traffic can run into free-tier write quotas faster than stateless templates.

## Example embed code
```html
<iframe src="https://your-worker.workers.dev" width="100%" height="500" frameborder="0"></iframe>
```
