# Math Equation Renderer

## What it does
Renders user-entered math expressions as MathML in the browser, including equations, fractions, powers, square roots, and simple subscripts.

## What you need
- Cloudflare API Token to deploy and update the worker from the app.
- Cloudflare Account ID for the Workers account that will host the app.

## Live app endpoints
| Path | What it does |
|------|-------------|
| GET / | Interactive equation renderer and MathML exporter |

## Input tips
- Use `frac(a,b)` for fractions
- Use `^` for exponents
- Use names like `x_1` for subscripts
