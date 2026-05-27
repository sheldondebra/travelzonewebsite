# Legacy MySQL → OnlinePOS schema parity

Comparison of the **Novasori** phpMyAdmin dump (`novasori_novaosp.sql`) against the new PostgreSQL (Prisma) schema.

## Import modes

| Mode | What is imported |
|------|------------------|
| `products_only` | Categories, subcategories, brands, units, warehouses, products, variants |
| `products_and_stock` | Above + `product_warehouse` stock quantities |
| `full` | Above + business settings, customers, sales history, adjustment audit trail |

**Bundled import** (`Import bundled Novasori database`) runs **`full`** mode.

---

## Mapped tables (data preserved)

| Legacy table | New location | Notes |
|--------------|--------------|--------|
| `categories` | `ProductCategory` | `oldId` preserved |
| `subcategories` | `ProductSubCategory` | |
| `brands` | `ProductBrand` | Images → `/products/...` |
| `units` | `ProductUnit` | |
| `warehouses` | `Warehouse` | `mobile` → `phone` |
| `products` | `Product` | SIMPLE / VARIABLE types |
| `product_variants` | `ProductVariant` | |
| `product_warehouse` | `ProductStock` + `StockHistory` (IMPORT) | |
| `settings` | `Business` fields + `settings.legacy` JSON | Name, tax, receipt, logo |
| `currencies` | `Business.currency` + `settings.legacy` | |
| `pos_settings` | `settings.legacy` JSON | |
| `payment_methods` | `settings.legacyPaymentMethodMap` | Maps to `PaymentMethod` enum on orders |
| `clients` | `Customer` | `oldId`, `legacyCode`, balance, address |
| `sales` | `Order` | `oldId`, `reference`, no stock re-deduction |
| `sale_details` | `OrderItem` | Variant lines supported |
| `payment_sales` | `Order.paymentMethod`, `amountPaid` | |
| `adjustment_details` | `StockHistory` (ADJUSTMENT) | **Audit only** — does not change current stock |

---

## Novasori dump row counts (reference)

| Table | Rows in dump | Import status |
|-------|-------------|---------------|
| products | 89 | ✅ |
| product_variants | 247 | ✅ |
| product_warehouse | 253 | ✅ |
| clients | 34 | ✅ full mode |
| sales | 41 | ✅ full mode |
| sale_details | 126 | ✅ full mode |
| payment_sales | 41 | ✅ full mode |
| adjustment_details | 283 | ✅ full mode (history) |
| adjustments | 60 | Metadata in stock history notes |
| settings | 1 | ✅ full mode |
| payment_methods | 8 | ✅ full mode |
| providers | 0 | N/A in this dump |
| purchases | 0 | N/A in this dump |
| expenses | 0 | N/A in this dump |

---

## Deferred (not in this dump or next phase)

These legacy tables exist in Stocky-style databases but are **not** in the Novasori export or need dedicated modules:

| Legacy table | Planned new model |
|--------------|-------------------|
| `providers` | `Supplier` (+ `oldId`) |
| `purchases` / `purchase_details` | `PurchaseOrder` |
| `expenses` / `expense_categories` | `Expense` |
| `users` | `User` (passwords not auto-imported — security) |
| `cash_registers` | Future POS register module |
| `count_stock` | Stock count sessions |
| `damages` / `transfers` | Inventory movement extensions |
| `sale_returns` | Returns module |
| HR / accounting (`employees`, `acc_*`, …) | Out of POS scope |

Raw rows for deferred tables remain in the uploaded `ImportSession.sqlContent` for manual recovery.

---

## Re-import safety

- Upsert by `oldId` per business when **Update existing** is enabled (default).
- `MigrationLog` records every row: SUCCESS / FAILED / SKIPPED.
- Sales import does **not** decrement stock again (historical orders only).

---

## How to run full parity import

1. Dashboard → **Products** → **Database import**
2. Choose **Full import** (or use **Import bundled Novasori database**)
3. Enable **Update existing records**
4. Review migration logs and download error report if any failures
