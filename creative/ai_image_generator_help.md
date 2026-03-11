# AI Image Generator

## What it does
Generate images from text prompts using AI. After deployment, the main live route is `POST /`.

## What you need
- Cloudflare API Token to deploy and update the worker from the app.
- Cloudflare Account ID for the Workers account that will host the app.
- FAL_API_KEY for Fal.ai image generation.
- A Fal.ai account with quota for the image model you plan to call.

## Configuration fields
| Field | Description | Example |
|-------|-------------|---------|
| prompt | Prompt sent to the image model. | Describe the image you want to generate... |

## Live app endpoints
| Path | What it does |
|------|-------------|
| POST / | Accepts an image prompt and returns an image URL from the Fal.ai workflow. |

## Tips & limits
- Cloudflare Workers free tier: plan around request quotas and tight per-request CPU budgets on the free plan.
- Prompt quality matters: subject, style, lighting, and composition cues usually improve the returned image.

## Example embed code
```html
<iframe src="https://your-worker.workers.dev" width="100%" height="500" frameborder="0"></iframe>
```
