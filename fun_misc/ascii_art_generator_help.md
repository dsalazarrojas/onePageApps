# ASCII Art Generator

## What it does
Convert any text into bold block-style ASCII art using a built-in character map. Three visual styles are available: Block (filled), Shadow (gradient), and Slim (hash). After deployment, it exposes the routes listed below, starting with `GET /`.

## What you need
- Cloudflare API Token to deploy and update the worker from the app.
- Cloudflare Account ID for the Workers account that will host the app.

## Configuration fields
| Field | Description | Example |
|-------|-------------|---------|
| text | Text to render as ASCII art (max 30 chars) | HELLO |
| font | Style of the ASCII art | block |

## Live app endpoints
| Path | What it does |
|------|-------------|
| GET / | Shows the ASCII art generator UI with live preview, style selector, and copy/download buttons. |
| POST / | Accepts `{ text, font? }` JSON; returns the ASCII art string and line count. |

## Tips & limits
- Cloudflare Workers free tier: plan around request quotas and tight per-request CPU budgets on the free plan.
- Accepted `font` values: `block` (default), `shadow`, `slim`.
- Input is normalised to uppercase before rendering. Characters without a glyph fall back to `?`.
- Best results with 10 characters or fewer; longer text will still render but may be wide.

## Example embed code
```html
<iframe src="https://your-worker.workers.dev" width="100%" height="600" frameborder="0"></iframe>
```
