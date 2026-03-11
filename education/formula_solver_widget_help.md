# Formula Solver Widget

## What it does
Solves one variable in a user-provided equation using safe tokenized evaluation and numerical root-finding in the browser.

## What you need
- Cloudflare API Token to deploy and update the worker from the app.
- Cloudflare Account ID for the Workers account that will host the app.

## Live app endpoints
| Path | What it does |
|------|-------------|
| GET / | Interactive formula solver UI |

## Notes
- Use exactly one equals sign.
- Supported functions: `sqrt`, `sin`, `cos`, `tan`, `log`, `ln`, `abs`, `pow`
- Supported constants: `pi`, `e`
