# Expense Tracker Simple Embed

Monthly expense tracking with category breakdown. Data stored in KV by month.

## Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/` | Expense tracker UI |
| GET | `/expenses?month=YYYY-MM` | List month expenses |
| POST | `/expenses` | Add expense |
| DELETE | `/expenses` | Delete by id + month |
| GET | `/summary?month=YYYY-MM` | Totals by category |

## POST /expenses

```json
{ "date": "2025-06-15", "amount": 12.50, "category": "Food", "description": "Lunch" }
```

## KV Binding

```toml
[[kv_namespaces]]
binding = "DATA"
id = "YOUR_KV_ID"
```
