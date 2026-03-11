# Reading Time Estimator

## What it does
Paste any text and instantly get estimated reading, speaking, and typing times, plus detailed statistics (word count, character count, sentence count, paragraph count, unique words, average word/sentence length) and a top-keywords list. After deployment, it exposes the routes listed below, starting with `GET /`.

## What you need
- Cloudflare API Token to deploy and update the worker from the app.
- Cloudflare Account ID for the Workers account that will host the app.

## Configuration fields
| Field | Description | Example |
|-------|-------------|---------|
| text | The text to analyse | (your article body) |
| wordsPerMinute | Average adult reading speed (defaults to 238) | 238 |

## Live app endpoints
| Path | What it does |
|------|-------------|
| GET / | Shows the reading time estimator UI with a text area, WPM control, and rich stats panel. |
| POST / | Accepts `{ text, wordsPerMinute? }` JSON; returns reading/speaking/typing times, word statistics, and top keywords. |

## Tips & limits
- Cloudflare Workers free tier: plan around request quotas and tight per-request CPU budgets on the free plan.
- Default reading speed of 238 WPM is based on published averages for adult non-fiction reading; adjust to your audience.
- Speaking time is calculated at 125 WPM (average presentation pace).
- Typing time is calculated at 987 characters per minute (average typist).
- Top keywords exclude common stop words (the, a, and, etc.).

## Example embed code
```html
<iframe src="https://your-worker.workers.dev" width="100%" height="700" frameborder="0"></iframe>
```
