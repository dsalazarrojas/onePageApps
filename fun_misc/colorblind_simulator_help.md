# Colorblind Simulator

## What it does
Preview how any hex color appears under six types of color vision deficiency (deuteranopia, protanopia, tritanopia, achromatopsia, and their anomalous variants) using LMS-space simulation matrices. The UI also lets you upload an image and compare all simulations side-by-side. After deployment, it exposes the routes listed below, starting with `GET /`.

## What you need
- Cloudflare API Token to deploy and update the worker from the app.
- Cloudflare Account ID for the Workers account that will host the app.

## Configuration fields
| Field | Description | Example |
|-------|-------------|---------|
| hex | Input color as a CSS hex string | #3b82f6 |
| type | Simulation type or "all" for all types | all |

## Live app endpoints
| Path | What it does |
|------|-------------|
| GET / | Shows the colorblind simulator UI with color picker, swatches, and optional image upload. |
| POST / | Accepts `{ hex, type? }` JSON; returns the simulated RGB and hex values for each requested vision type. |

## Tips & limits
- Cloudflare Workers free tier: plan around request quotas and tight per-request CPU budgets on the free plan.
- Accepted `type` values: `deuteranopia`, `protanopia`, `tritanopia`, `achromatopsia`, `deuteranomaly`, `protanomaly`, or `all`.
- Image simulation is entirely client-side — no image data is sent to the worker.
- Simulation uses Viénot 1999 / Machado 2009 simplified LMS matrices via linear RGB conversion.

## Example embed code
```html
<iframe src="https://your-worker.workers.dev" width="100%" height="700" frameborder="0"></iframe>
```
