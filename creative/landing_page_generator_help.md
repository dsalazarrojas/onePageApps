# Landing Page Generator

## What it does
Create single-page websites from content. After deployment, the main live route is `POST /`.

## What you need
- Cloudflare API Token to deploy and update the worker from the app.
- Cloudflare Account ID for the Workers account that will host the app.

## Configuration fields
| Field | Description | Example |
|-------|-------------|---------|
| title | Title shown in the generated page or survey. | My Awesome Product |
| content | Main body copy used to build the landing page. | Describe your product or service... |
| style | Visual style preset for the generated HTML page. | modern, minimal, corporate |

## Live app endpoints
| Path | What it does |
|------|-------------|
| POST / | Returns a complete single-page HTML landing page. |

## Tips & limits
- Cloudflare Workers free tier: plan around request quotas and tight per-request CPU budgets on the free plan.
- The generated HTML is single-page only; multi-page sites or CMS integrations need extra work afterward.

## Example embed code
```html
<iframe src="https://your-worker.workers.dev" width="100%" height="500" frameborder="0"></iframe>
```
