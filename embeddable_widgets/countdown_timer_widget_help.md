# Countdown Timer Widget
## What it does
Embeds a live countdown timer (days/hours/mins/secs) on any host page via a `<script>` tag that injects inline.
## Endpoints
| Path | Method | Description |
|------|--------|-------------|
| `GET /` | GET | Interactive builder with live preview |
| `GET /widget.js` | GET | Host-page injector |
## Embed
```html
<script src="https://your-worker.workers.dev/widget.js"
  data-target="2025-12-31T23:59:59Z"
  data-label="New Year Countdown"
  data-theme="dark">
</script>
```
## Data attributes
| Attribute | Default | Description |
|-----------|---------|-------------|
| `data-target` | required | ISO 8601 datetime |
| `data-label` | – | Label above timer |
| `data-theme` | dark | `dark` or `light` |
## Tips
- Stateless – no bindings required.
