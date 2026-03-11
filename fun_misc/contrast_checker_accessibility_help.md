# Contrast Checker (Accessibility)

## What it does
Calculate the WCAG 2.1 contrast ratio between any two colors and report pass/fail against all five WCAG criteria (AA Normal, AA Large, AAA Normal, AAA Large, AA UI Components). Includes a live text preview rendered in the chosen color pair. After deployment, it exposes the routes listed below, starting with `GET /`.

## What you need
- Cloudflare API Token to deploy and update the worker from the app.
- Cloudflare Account ID for the Workers account that will host the app.

## Configuration fields
| Field | Description | Example |
|-------|-------------|---------|
| foreground | Text/foreground color as a CSS hex string | #1e293b |
| background | Background color as a CSS hex string | #ffffff |

## Live app endpoints
| Path | What it does |
|------|-------------|
| GET / | Shows the contrast checker UI with color pickers, a live preview panel, and WCAG result cards. |
| POST / | Accepts `{ foreground, background }` JSON; returns the contrast ratio and WCAG AA/AAA pass/fail results. |

## Tips & limits
- Cloudflare Workers free tier: plan around request quotas and tight per-request CPU budgets on the free plan.
- Both colors must be provided as `#RRGGBB` or `#RGB` hex strings.
- Luminance is calculated per the WCAG 2.1 spec using IEC 61966-2-1 sRGB linearisation.
- Contrast ratio of 1:1 means identical colors; 21:1 is the maximum (black on white).

## Example embed code
```html
<iframe src="https://your-worker.workers.dev" width="100%" height="700" frameborder="0"></iframe>
```
