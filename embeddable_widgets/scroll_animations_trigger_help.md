# Scroll Animations Trigger
## What it does
Injects IntersectionObserver-based scroll animations on the host page. Elements with `data-animate` (or a custom selector) fade/slide in as they enter the viewport.
## Endpoints
| Path | Method | Description |
|------|--------|-------------|
| `GET /` | GET | Builder UI |
| `GET /widget.js` | GET | Host-page injector |
## Embed
```html
<script src="https://your-worker.workers.dev/widget.js"
  data-selector="[data-animate]"
  data-animation="fadeInUp"
  data-threshold="0.15">
</script>
<!-- Then on your elements: -->
<div data-animate>Animated content</div>
<div data-animate data-animation="slideInLeft">Custom per-element animation</div>
```
## Animations
`fadeInUp` · `fadeIn` · `slideInLeft` · `slideInRight`
## Tips
- Stateless – no bindings required. Uses native IntersectionObserver.
