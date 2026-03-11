# Checklist Maker

## What it does
Creates a shareable checklist app backed by a Cloudflare KV namespace named `DATA`. A checklist gets a readable URL key, and everyone opening that URL sees and updates the same saved checklist state.

## What you need
- Cloudflare API Token to deploy and update the worker from the app.
- Cloudflare Account ID for the Workers account that will host the app.
- `DATA` KV binding for checklist documents and item state.

## Configuration fields
This template does not require pre-deployment form fields. Users create the checklist title, notes, and items in the deployed web UI.

## Live app endpoints
| Path | What it does |
|------|-------------|
| GET / | Shows the checklist creator UI. |
| POST /api/checklists | Creates a checklist, stores it in `DATA`, and returns the shared URL. |
| GET /c/{key} | Opens the shared checklist UI for a saved readable key. |
| GET /api/checklists/{key} | Returns the saved checklist JSON for the shared key. |
| POST /api/checklists/{key} | Updates checklist details or item state for the shared key. |

## Tips & limits
- Cloudflare KV is eventually consistent, so rapid edits from many regions can briefly show older values before the newest state propagates.
- This worker intentionally treats the shared URL as the edit URL too. Anyone with the link can update checklist state.
- Keep item counts reasonable so the checklist stays fast to load and easy to manage.

## Example embed code
```html
<iframe src="https://your-worker.workers.dev" width="100%" height="720" frameborder="0"></iframe>
```
