# Accessibility Checker Embed

## What it does
Paste HTML and scan for common accessibility issues like missing alt text, unlabeled form fields, empty buttons/links, heading-order jumps, and missing document metadata.

## Endpoints
| Path | Method | Description |
|------|--------|-------------|
| `GET /` | GET | Interactive checker UI |
| `GET /widget.js` | GET | Iframe embed loader |

## Embed
```html
<script src="https://your-worker.workers.dev/widget.js"></script>
```

## Tips
- Stateless and self-contained.
- Best for quick reviews of snippets, components, and CMS-generated markup before publishing.
