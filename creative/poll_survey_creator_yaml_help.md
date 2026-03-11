# Poll Survey Creator (YAML)

## What it does
Create and edit surveys using a YAML format, includes visual editor and protected results. After deployment, it exposes the routes listed below, starting with `GET /`.

## What you need
- Cloudflare API Token to deploy and update the worker from the app.
- Cloudflare Account ID for the Workers account that will host the app.
- SURVEY_KV binding so saved YAML surveys, response rows, and counters persist between requests.

## Configuration fields
| Field | Description | Example |
|-------|-------------|---------|
| title | Working title for the YAML survey you are editing. | Customer Satisfaction Survey |
| yaml | Optional YAML survey definition for the advanced survey worker. | Paste or edit YAML here... |

## Live app endpoints
| Path | What it does |
|------|-------------|
| GET / | Shows the YAML survey editor. |
| GET /saved | Lists saved surveys. |
| POST /save | Stores YAML + JSON survey definitions. |
| GET /survey?id=... | Shows a public survey page for a saved survey. |
| POST /submit | Stores responses for a saved survey. |
| GET /results?id=...&pw=... | Shows password-protected survey results. |
| GET /results.csv?id=...&pw=... | Exports responses as CSV. |
| GET /download?id=... | Downloads the saved YAML file. |

## Tips & limits
- Cloudflare Workers free tier: plan around request quotas and tight per-request CPU budgets on the free plan.
- KV-backed templates should also account for free-tier read/write quotas and eventual consistency on repeated reads.
- Protect the survey results password carefully because the results and CSV endpoints rely on it for access control.

## Example embed code
```html
<iframe src="https://your-worker.workers.dev" width="100%" height="500" frameborder="0"></iframe>
```
