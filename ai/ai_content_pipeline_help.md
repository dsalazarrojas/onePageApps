# AI Content Pipeline

## What it does
Chain up to 3 LLM transformation steps. Input flows through each step to produce a final output. After deployment, it exposes the routes listed below, starting with `GET /`.

## What you need
- Cloudflare API Token to deploy and update the worker from the app.
- Cloudflare Account ID for the Workers account that will host the app.
- OPENAI_API_KEY plus optional OPENAI_BASE_URL and MODEL values for the multi-step pipeline.
- At least STEP1_PROMPT and STEP2_PROMPT should be configured before launch.

## Configuration fields
| Field | Description | Example |
|-------|-------------|---------|
| PIPELINE_NAME | Display name shown above the multi-step pipeline. | Blog Post Generator |
| INPUT_LABEL | Label shown above the source input box. | Paste your notes |
| OUTPUT_LABEL | Label shown above the output panel. | Your blog post |
| STEP1_PROMPT | System prompt for pipeline step 1. | You are an outline generator. Turn the input into a structured outline. |
| STEP2_PROMPT | System prompt for pipeline step 2. | You are a blog writer. Expand the outline into a full blog post. |
| STEP3_PROMPT | Optional system prompt for pipeline step 3. | You are an editor. Polish the blog post for clarity and tone. |
| MODEL | OpenAI-compatible model name used for responses. | llama-3.3-70b-versatile |

## Live app endpoints
| Path | What it does |
|------|-------------|
| GET / | Shows the multi-step pipeline UI. |
| POST /run | Runs the configured steps and returns each stage plus the final output. |

## Tips & limits
- Cloudflare Workers free tier: plan around request quotas and tight per-request CPU budgets on the free plan.
- Every enabled step adds latency and model cost, so keep prompts short and purposeful.

## Example embed code
```html
<iframe src="https://your-worker.workers.dev" width="100%" height="500" frameborder="0"></iframe>
```
