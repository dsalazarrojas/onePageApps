# BMI & BMR Calculator

## What it does
Calculate Body Mass Index (BMI) and Basal Metabolic Rate (BMR) using the Mifflin-St Jeor equation, plus Total Daily Energy Expenditure (TDEE) based on activity level. After deployment, it exposes the routes listed below, starting with `GET /`.

## What you need
- Cloudflare API Token to deploy and update the worker from the app.
- Cloudflare Account ID for the Workers account that will host the app.

## Configuration fields
| Field | Description | Example |
|-------|-------------|---------|
| weightKg | Body weight in kilograms | 70 |
| heightCm | Height in centimetres | 170 |
| ageYears | Age in whole years | 30 |
| sex | Biological sex for BMR formula | male |

## Live app endpoints
| Path | What it does |
|------|-------------|
| GET / | Shows the BMI & BMR calculator UI with metric/imperial toggle and activity selector. |
| POST / | Accepts `{ weightKg, heightCm, ageYears, sex, activityLevel }` JSON; returns BMI, BMI category, BMR, TDEE, and ideal weight range. |

## Tips & limits
- Cloudflare Workers free tier: plan around request quotas and tight per-request CPU budgets on the free plan.
- Accepted `activityLevel` values: `sedentary`, `light`, `moderate`, `active`, `veryActive`.
- The UI supports imperial input (lb/in) and converts to metric before submitting to the API.
- BMR formula used: Mifflin-St Jeor (more accurate than the original Harris-Benedict).

## Example embed code
```html
<iframe src="https://your-worker.workers.dev" width="100%" height="700" frameborder="0"></iframe>
```
