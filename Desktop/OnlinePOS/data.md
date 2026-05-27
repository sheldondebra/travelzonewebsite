# Novasori legacy database — full migration

## Source file

Place the phpMyAdmin dump at:

- `novasori_novaosp.sql` (project root) **recommended**
- or `import-data/novasori_novaosp.sql`

## One-command reset + import

Wipes **all** Novasori tenant catalog, customers, orders, and re-imports from the SQL file. App logins are kept.

```bash
npx prisma migrate deploy
npx prisma generate
npm run db:reset-import-novasori
```

## Legacy totals (verified)

| Metric | Value | Notes |
|--------|-------|--------|
| Active sales | 36 | Soft-deleted sales in dump are excluded |
| **Total sales (GrandTotal)** | **GHS 53,605.00** | Matches what the client sees as yearly “profit” / sales total in the old system |
| Line items (`sale_details.total`) | GHS 53,605.00 | Same as GrandTotal for active sales |
| Gross margin (revenue − cost) | ~GHS 29,085 | True profit; Reports → Gross profit |
| Products | 89 | |
| Variants | 247 | Cost/price/wholesale from `product_variants` |
| Clients | 33 | |
| Stock rows | 246 | `product_warehouse` |

## Field parity

| Legacy | New system |
|--------|------------|
| `products.cost` / `price` / `wholesale_price` / `min_price` | `costPrice`, `price`, `wholesalePrice`, `minimumPrice` |
| `product_variants.cost` / `price` / `wholesale` | `costPrice`, `retailPrice`, `wholesalePrice` |
| Warranty, points, barcode type, etc. | `Product.legacyMeta` JSON |
| `sales.GrandTotal` | `Order.totalAmount` |
| `sales.paid_amount` | `Order.amountPaid` |
| `sale_details.quantity` / `total` | `OrderItem.quantity`, `lineTotal`, unit price |
| `payment_sales.montant` | `Order.legacyMeta.payment_sales` |
| `clients` | `Customer` (`oldId`) |
| `users` | `LegacyUser` (not login accounts) |
| `cash_registers` | `CashRegister` |
| `sale_returns` | `SaleReturn` |

## Do not use CSV import for `.sql`

Use **Products → Database import** or `npm run db:reset-import-novasori`. Uploading the dump on **Import products (CSV)** creates invalid rows.

## Repeat import (no reset)

```bash
npm run db:import-novasori -- --force-update
npm run db:import-sales-history -- --force-update
```
