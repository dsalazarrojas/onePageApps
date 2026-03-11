# Embeddable Budget Planner

Monthly budget planner with category allocation and actual spending tracked in KV.

## Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/` | Budget planner UI |
| GET | `/budget?month=YYYY-MM` | Get budget + actuals |
| POST | `/budget` | Save budget plan |
| POST | `/actual` | Record spending in a category |

## POST /budget

```json
{ "month": "2025-06", "income": 4000, "categories": [{"name":"Food","budgeted":500},{"name":"Rent","budgeted":1200}] }
```

## POST /actual

```json
{ "month": "2025-06", "category": "Food", "amount": 45.50 }
```

## KV Binding

```toml
[[kv_namespaces]]
binding = "DATA"
id = "YOUR_KV_ID"
```
