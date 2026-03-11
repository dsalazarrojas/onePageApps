# Quiz Builder Embed

Create multiple-choice quizzes. Correct answers stored server-side; stats tracked in KV.

## Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/` | Quiz builder & player UI |
| GET | `/quiz?id=ID` | Get quiz (no correct answers) |
| POST | `/quiz` | Save quiz |
| POST | `/submit` | Submit answers, get score |
| GET | `/results?id=ID` | Aggregate attempt stats |

## POST /quiz

```json
{
  "id": "geography",
  "title": "World Geography",
  "questions": [
    { "text": "Capital of France?", "options": ["London","Paris","Berlin"], "correct": "Paris" }
  ]
}
```

## POST /submit

```json
{ "quizId": "geography", "answers": { "0": "Paris" } }
```

## KV Binding

```toml
[[kv_namespaces]]
binding = "DATA"
id = "YOUR_KV_ID"
```
