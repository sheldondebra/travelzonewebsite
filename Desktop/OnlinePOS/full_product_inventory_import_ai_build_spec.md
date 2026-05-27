# Cursor Build Spec: Full Product, Pricing, Inventory & Database Import System

## Project Goal

Build a fully functioning product, pricing, inventory, and database import system for the new application.

The old system database was exported from phpMyAdmin as a MySQL/MariaDB SQL dump. The new application uses PostgreSQL hosted on Neon.

The system must allow the business to safely migrate old product data, pricing, variants, stock, images, categories, brands, units, warehouses, and related settings into the new application without losing data.

The new system must be simple enough for shop/business staff to use.

---

# 1. Main Requirements

Build the following modules:

1. Product management
2. Simple product setup
3. Variable product setup
4. Product pricing
5. Price adjustment
6. Bulk price update
7. Product stock/inventory
8. Warehouse stock tracking
9. Product image handling
10. Old database import/migration
11. Import validation and error reporting
12. Price history tracking
13. Stock history tracking
14. User-friendly admin interface

---

# 2. Required Old Database Tables to Import

These tables are required to make the product, pricing, and inventory system work.

## Minimum Required Tables

```txt
categories
subcategories
brands
units
warehouses
products
product_variants
product_warehouse
settings
pos_settings
currencies
```

## Recommended Required Tables

Import these too because they support users, sales, payments, and POS operation.

```txt
users
clients
payment_methods
cash_registers
sales
sale_details
payment_sales
adjustments
adjustment_details
count_stock
providers
purchases
purchase_details
payment_purchases
```

## Optional Tables

Import these only if the new app supports them.

```txt
transfers
transfer_details
damages
damage_details
expenses
expense_categories
roles
permissions
model_has_roles
model_has_permissions
role_has_permissions
```

---

# 3. Correct Import Order

The import must respect relationships.

Use this order:

```txt
1. currencies
2. settings
3. pos_settings
4. users
5. clients
6. providers
7. categories
8. subcategories
9. brands
10. units
11. warehouses
12. products
13. product_variants
14. product_warehouse
15. payment_methods
16. cash_registers
17. sales
18. sale_details
19. payment_sales
20. adjustments
21. adjustment_details
22. count_stock
23. purchases
24. purchase_details
25. payment_purchases
26. transfers
27. transfer_details
28. damages
29. damage_details
```

The system must allow partial import, but it must clearly warn the admin when dependencies are missing.

---

# 4. Important Data Meaning

## Products

The old `products` table stores main product data.

Important fields:

```txt
id
type
code
name
cost
price
wholesale_price
min_price
category_id
sub_category_id
brand_id
unit_id
image
stock_alert
is_variant
is_active
created_at
updated_at
deleted_at
```

## Product Variants

The old `product_variants` table stores options like sizes, colors, weights, package types, etc.

Important fields:

```txt
id
product_id
name
code
cost
price
wholesale
min_price
```

## Product Warehouse

The old `product_warehouse` table stores stock quantity.

Important fields:

```txt
id
product_id
product_variant_id
warehouse_id
qte
manage_stock
```

---

# 5. Product Type Rules

## Simple Product

A simple product has one price and one stock quantity.

Old database rule:

```txt
products.is_variant = 0
```

New database rule:

```txt
products.type = simple
```

Simple product prices are stored directly on the product.

Simple product stock has no variant ID.

```txt
product_stock.variant_id = null
```

---

## Variable Product

A variable product has multiple options such as size, color, type, weight, or package.

Old database rule:

```txt
products.is_variant = 1
```

New database rule:

```txt
products.type = variable
```

Variable product prices must be stored on each variant, not only on the parent product.

Variable product stock must reference both the product and the variant.

```txt
product_stock.product_id = product.id
product_stock.variant_id = variant.id
```

---

# 6. Recommended New PostgreSQL Schema

Use UUIDs for new records, but preserve old numeric IDs in `old_id`.

Enable PostgreSQL UUID support:

```sql
CREATE EXTENSION IF NOT EXISTS pgcrypto;
```

---

## Table: `currencies`

```sql
CREATE TABLE currencies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  old_id BIGINT UNIQUE,
  code TEXT,
  name TEXT,
  symbol TEXT,
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);
```

---

## Table: `settings`

```sql
CREATE TABLE settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  old_id BIGINT UNIQUE,
  company_name TEXT,
  company_email TEXT,
  company_phone TEXT,
  company_address TEXT,
  logo_url TEXT,
  favicon_url TEXT,
  currency_id UUID REFERENCES currencies(id),
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);
```

---

## Table: `categories`

```sql
CREATE TABLE categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  old_id BIGINT UNIQUE,
  name TEXT NOT NULL,
  code TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now(),
  deleted_at TIMESTAMP
);
```

---

## Table: `subcategories`

```sql
CREATE TABLE subcategories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  old_id BIGINT UNIQUE,
  category_id UUID REFERENCES categories(id),
  name TEXT NOT NULL,
  code TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now(),
  deleted_at TIMESTAMP
);
```

---

## Table: `brands`

```sql
CREATE TABLE brands (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  old_id BIGINT UNIQUE,
  name TEXT NOT NULL,
  code TEXT,
  image_url TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now(),
  deleted_at TIMESTAMP
);
```

---

## Table: `units`

```sql
CREATE TABLE units (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  old_id BIGINT UNIQUE,
  name TEXT NOT NULL,
  short_name TEXT,
  base_unit TEXT,
  operator TEXT,
  operator_value NUMERIC(12, 4),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now(),
  deleted_at TIMESTAMP
);
```

---

## Table: `warehouses`

```sql
CREATE TABLE warehouses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  old_id BIGINT UNIQUE,
  name TEXT NOT NULL,
  phone TEXT,
  country TEXT,
  city TEXT,
  email TEXT,
  zip TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now(),
  deleted_at TIMESTAMP
);
```

---

## Table: `products`

```sql
CREATE TABLE products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  old_id BIGINT UNIQUE,

  name TEXT NOT NULL,
  sku TEXT UNIQUE,
  barcode TEXT,

  type TEXT NOT NULL CHECK (type IN ('simple', 'variable')),

  description TEXT,

  category_id UUID REFERENCES categories(id),
  sub_category_id UUID REFERENCES subcategories(id),
  brand_id UUID REFERENCES brands(id),
  unit_id UUID REFERENCES units(id),

  image_url TEXT,

  cost_price NUMERIC(12, 2) DEFAULT 0,
  retail_price NUMERIC(12, 2) DEFAULT 0,
  wholesale_price NUMERIC(12, 2) DEFAULT 0,
  minimum_price NUMERIC(12, 2) DEFAULT 0,

  stock_alert NUMERIC(12, 2) DEFAULT 0,
  is_active BOOLEAN DEFAULT true,

  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now(),
  deleted_at TIMESTAMP
);
```

---

## Table: `product_variants`

```sql
CREATE TABLE product_variants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  old_id BIGINT UNIQUE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,

  name TEXT NOT NULL,
  sku TEXT UNIQUE,
  barcode TEXT,

  image_url TEXT,

  cost_price NUMERIC(12, 2) DEFAULT 0,
  retail_price NUMERIC(12, 2) DEFAULT 0,
  wholesale_price NUMERIC(12, 2) DEFAULT 0,
  minimum_price NUMERIC(12, 2) DEFAULT 0,

  is_active BOOLEAN DEFAULT true,

  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now(),
  deleted_at TIMESTAMP
);
```

---

## Table: `product_stock`

```sql
CREATE TABLE product_stock (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  variant_id UUID REFERENCES product_variants(id) ON DELETE CASCADE,
  warehouse_id UUID REFERENCES warehouses(id),

  quantity NUMERIC(12, 2) DEFAULT 0,
  manage_stock BOOLEAN DEFAULT true,

  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now(),

  CONSTRAINT unique_product_variant_warehouse UNIQUE (
    product_id,
    variant_id,
    warehouse_id
  )
);
```

---

## Table: `product_price_history`

```sql
CREATE TABLE product_price_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  variant_id UUID REFERENCES product_variants(id) ON DELETE CASCADE,

  price_type TEXT NOT NULL CHECK (
    price_type IN ('cost_price', 'retail_price', 'wholesale_price', 'minimum_price')
  ),

  old_price NUMERIC(12, 2),
  new_price NUMERIC(12, 2),

  changed_by UUID,
  reason TEXT,

  created_at TIMESTAMP DEFAULT now()
);
```

---

## Table: `stock_history`

```sql
CREATE TABLE stock_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  variant_id UUID REFERENCES product_variants(id) ON DELETE CASCADE,
  warehouse_id UUID REFERENCES warehouses(id),

  old_quantity NUMERIC(12, 2),
  new_quantity NUMERIC(12, 2),
  quantity_changed NUMERIC(12, 2),

  action TEXT NOT NULL CHECK (
    action IN ('import', 'manual_adjustment', 'sale', 'purchase', 'transfer', 'damage', 'return')
  ),

  reference_type TEXT,
  reference_id UUID,

  changed_by UUID,
  note TEXT,

  created_at TIMESTAMP DEFAULT now()
);
```

---

## Table: `migration_logs`

```sql
CREATE TABLE migration_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  table_name TEXT NOT NULL,
  old_id BIGINT,
  new_id UUID,

  status TEXT NOT NULL CHECK (status IN ('success', 'failed', 'skipped', 'warning')),
  message TEXT,

  source_data JSONB,

  created_at TIMESTAMP DEFAULT now()
);
```

---

# 7. Data Mapping Rules

## Categories

```txt
old categories.id   -> categories.old_id
old categories.name -> categories.name
old categories.code -> categories.code
```

## Subcategories

```txt
old subcategories.id          -> subcategories.old_id
old subcategories.name        -> subcategories.name
old subcategories.category_id -> categories.id using old_id mapping
```

## Brands

```txt
old brands.id    -> brands.old_id
old brands.name  -> brands.name
old brands.image -> brands.image_url
```

## Units

```txt
old units.id             -> units.old_id
old units.name           -> units.name
old units.short_name     -> units.short_name
old units.base_unit      -> units.base_unit
old units.operator       -> units.operator
old units.operator_value -> units.operator_value
```

## Warehouses

```txt
old warehouses.id      -> warehouses.old_id
old warehouses.name    -> warehouses.name
old warehouses.phone   -> warehouses.phone
old warehouses.country -> warehouses.country
old warehouses.city    -> warehouses.city
old warehouses.email   -> warehouses.email
old warehouses.zip     -> warehouses.zip
```

## Products

```txt
old products.id              -> products.old_id
old products.code            -> products.sku
old products.name            -> products.name
old products.image           -> products.image_url
old products.category_id     -> categories.id using old_id mapping
old products.sub_category_id -> subcategories.id using old_id mapping
old products.brand_id        -> brands.id using old_id mapping
old products.unit_id         -> units.id using old_id mapping
old products.stock_alert     -> products.stock_alert
old products.is_active       -> products.is_active
old products.deleted_at      -> products.deleted_at
```

### Simple product pricing

```txt
old products.cost            -> products.cost_price
old products.price           -> products.retail_price
old products.wholesale_price -> products.wholesale_price
old products.min_price       -> products.minimum_price
```

### Variable product parent pricing

For variable products, store parent price fields as zero or as reference values only.

```txt
products.type = variable
products.cost_price = 0
products.retail_price = 0
products.wholesale_price = 0
products.minimum_price = 0
```

## Product Variants

```txt
old product_variants.id         -> product_variants.old_id
old product_variants.product_id -> products.id using old_id mapping
old product_variants.name       -> product_variants.name
old product_variants.code       -> product_variants.sku
old product_variants.cost       -> product_variants.cost_price
old product_variants.price      -> product_variants.retail_price
old product_variants.wholesale  -> product_variants.wholesale_price
old product_variants.min_price  -> product_variants.minimum_price
```

## Product Stock

```txt
old product_warehouse.product_id         -> products.id using old_id mapping
old product_warehouse.product_variant_id -> product_variants.id using old_id mapping
old product_warehouse.warehouse_id       -> warehouses.id using old_id mapping
old product_warehouse.qte                -> product_stock.quantity
old product_warehouse.manage_stock       -> product_stock.manage_stock
```

---

# 8. Import System Requirements

Build an admin import page called:

```txt
Database Import
```

The page must allow an admin to:

```txt
Upload old MySQL SQL dump
Preview detected tables
Select which tables to import
See required dependency warnings
Run import
View progress
See success count
See failed count
Download error report
Retry failed rows
```

---

## Import Page Steps

### Step 1: Upload SQL Dump

Accepted formats:

```txt
.sql
.zip containing .sql
```

Show:

```txt
File name
File size
Detected database type
Detected table count
```

---

### Step 2: Analyze SQL Dump

The system must detect these tables:

```txt
categories
subcategories
brands
units
warehouses
products
product_variants
product_warehouse
settings
pos_settings
currencies
```

Show missing tables clearly.

Example:

```txt
products found
product_variants found
product_warehouse found
brands found
units found
warehouses found
categories found
subcategories found
```

If a required table is missing, show:

```txt
Warning: product_warehouse was not found. Products can be imported, but stock quantities may be missing.
```

---

### Step 3: Import Options

Allow admin to choose:

```txt
Import products only
Import products and stock
Import products, stock, and sales history
Full import
```

Also allow:

```txt
Skip duplicate records
Update existing records by old_id
Stop import on first error
Continue import and log errors
```

Recommended default:

```txt
Update existing records by old_id
Continue import and log errors
```

---

### Step 4: Import Preview

Before importing, show:

```txt
Table
Rows found
Rows ready to import
Warnings
```

Example:

```txt
products: 144 rows
product_variants: 247 rows
product_warehouse: 253 rows
categories: 15 rows
brands: 20 rows
warehouses: 2 rows
```

---

### Step 5: Run Import

Import in the correct order.

Show progress:

```txt
Importing categories...
Importing brands...
Importing units...
Importing warehouses...
Importing products...
Importing variants...
Importing stock...
```

---

### Step 6: Import Result

Show:

```txt
Imported successfully
Skipped duplicates
Failed rows
Warnings
Missing images
```

Provide buttons:

```txt
View Products
Download Error Report
Retry Failed Rows
Import Images
```

---

# 9. Image Migration Requirements

The SQL dump usually stores image paths only, not the real image files.

The system must support this safely.

## Image fields to support

```txt
products.image
product_variants.image
brands.image
settings.logo
settings.favicon
pos_settings logo fields
```

## Image behavior

If image URL exists:

```txt
Show image
```

If image file is missing:

```txt
Show placeholder
```

If old image path is relative:

```txt
Use NEXT_PUBLIC_OLD_IMAGE_BASE_URL
```

Example function:

```ts
export function getImageUrl(imagePath?: string | null) {
  if (!imagePath) return "/placeholder-product.png";

  if (imagePath.startsWith("http://") || imagePath.startsWith("https://")) {
    return imagePath;
  }

  const baseUrl = process.env.NEXT_PUBLIC_OLD_IMAGE_BASE_URL;

  if (!baseUrl) return "/placeholder-product.png";

  return `${baseUrl.replace(/\/$/, "")}/${imagePath.replace(/^\//, "")}`;
}
```

Environment variable:

```txt
NEXT_PUBLIC_OLD_IMAGE_BASE_URL=https://old-domain.com
```

Also allow new uploads to local storage, S3, Cloudinary, or app storage.

---

# 10. Product Management UI

Create page:

```txt
/products
```

Title:

```txt
Products
```

Features:

```txt
Search by name, SKU, barcode
Filter by category
Filter by brand
Filter by type: All, Simple, Variable
Filter by status: Active, Inactive
Filter by stock status: In Stock, Low Stock, Out of Stock
```

Table columns:

```txt
Image
Name
SKU
Type
Category
Brand
Retail Price
Wholesale Price
Stock
Status
Actions
```

Actions:

```txt
View
Edit
Adjust Price
Manage Stock
Deactivate
```

For variable products, show:

```txt
View Variants
```

---

# 11. Add/Edit Product UI

Create a step-by-step form.

## Step 1: Basic Information

Fields:

```txt
Product name
Product type
SKU / product code
Barcode
Category
Subcategory
Brand
Unit
Description
Product image
```

Use friendly labels:

```txt
Normal Product
Variable Product
```

Helper text:

```txt
Choose Normal Product if this item has only one version.
Choose Variable Product if this item has sizes, colors, weights, or other options.
```

---

## Step 2: Pricing

### For Normal Product

Fields:

```txt
Buying Price
Selling Price
Wholesale Price
Lowest Allowed Price
```

Helper text:

```txt
Buying Price: How much the business paid for the item.
Selling Price: The normal price customers pay.
Wholesale Price: Price for bulk buyers.
Lowest Allowed Price: Staff cannot sell below this amount.
```

### For Variable Product

Show variant builder.

Each variant must have:

```txt
Variant name
SKU / code
Buying Price
Selling Price
Wholesale Price
Lowest Allowed Price
Opening Stock
Image
```

Buttons:

```txt
Add Variant
Duplicate Variant
Remove Variant
```

---

## Step 3: Stock

For normal products:

```txt
Opening Stock
Warehouse
Low Stock Alert
Manage Stock
```

For variable products:

```txt
Stock is controlled per variant.
```

---

## Step 4: Review

Show:

```txt
Product name
Product type
Pricing summary
Stock summary
Variant count
Image preview
```

Buttons:

```txt
Back
Save Product
Save & Add Another
```

---

# 12. Pricing System

## Pricing Fields

Use friendly names in the UI.

```txt
cost_price       -> Buying Price
retail_price     -> Selling Price
wholesale_price  -> Wholesale Price
minimum_price    -> Lowest Allowed Price
```

---

## Pricing Rules

Backend must enforce:

```txt
Buying Price cannot be negative.
Selling Price cannot be negative.
Wholesale Price cannot be negative.
Lowest Allowed Price cannot be negative.
Selling Price cannot be below Lowest Allowed Price.
Variable product must have at least one variant.
Each variant must have a selling price.
```

Warnings:

```txt
Wholesale Price is below Buying Price. This may cause a loss.
Lowest Allowed Price is below Buying Price. Staff may sell at a loss.
```

---

# 13. Adjust Price Feature

Create modal/page:

```txt
Adjust Price
```

For simple products:

```txt
Current Buying Price
New Buying Price
Current Selling Price
New Selling Price
Current Wholesale Price
New Wholesale Price
Current Lowest Allowed Price
New Lowest Allowed Price
Reason for change
```

For variable products, show variant rows:

```txt
Variant
Current Selling Price
New Selling Price
Current Wholesale Price
New Wholesale Price
Current Lowest Allowed Price
New Lowest Allowed Price
Reason
```

Every change must create a record in `product_price_history`.

---

# 14. Bulk Price Update

Create page/modal:

```txt
Bulk Price Update
```

Allow filters:

```txt
Category
Brand
Product type
Selected products
```

Adjustment methods:

```txt
Increase selling price by percentage
Decrease selling price by percentage
Increase selling price by fixed amount
Decrease selling price by fixed amount
Set wholesale price
Set lowest allowed price
```

Before applying, show preview:

```txt
Product
Old Price
New Price
Difference
```

Require confirmation:

```txt
You are about to update prices for selected products. This will be recorded in price history.
```

---

# 15. Stock Management

Create page/modal:

```txt
Manage Stock
```

For simple products:

```txt
Warehouse
Current Stock
New Stock
Reason
```

For variable products:

```txt
Variant
Warehouse
Current Stock
New Stock
Reason
```

Every stock change must create a record in `stock_history`.

---

# 16. API Endpoints

## Products

```txt
GET    /api/products
GET    /api/products/:id
POST   /api/products
PATCH  /api/products/:id
DELETE /api/products/:id
```

## Variants

```txt
GET    /api/products/:id/variants
POST   /api/products/:id/variants
PATCH  /api/product-variants/:variantId
DELETE /api/product-variants/:variantId
```

## Pricing

```txt
POST   /api/products/:id/adjust-price
POST   /api/product-variants/:variantId/adjust-price
POST   /api/products/bulk-adjust-price
GET    /api/products/:id/price-history
```

## Stock

```txt
GET    /api/products/:id/stock
PATCH  /api/products/:id/stock
PATCH  /api/product-variants/:variantId/stock
GET    /api/products/:id/stock-history
```

## Import

```txt
POST   /api/import/upload
POST   /api/import/analyze
POST   /api/import/run
GET    /api/import/logs
GET    /api/import/errors/download
POST   /api/import/retry-failed
```

## Supporting Data

```txt
GET    /api/categories
GET    /api/subcategories
GET    /api/brands
GET    /api/units
GET    /api/warehouses
GET    /api/currencies
```

---

# 17. Backend Services

Create these services:

```txt
ProductService
ProductVariantService
PricingService
StockService
BulkPriceService
ImportService
SqlDumpParserService
ImageService
MigrationLogService
```

---

# 18. Import Service Logic

The import system must:

1. Parse MySQL dump safely
2. Read table structures
3. Extract INSERT rows
4. Normalize MySQL values
5. Convert MySQL dates to PostgreSQL-compatible dates
6. Convert 0000-00-00 to null
7. Preserve old IDs
8. Create mapping from old IDs to new UUIDs
9. Import parent tables first
10. Import child tables after parent records
11. Log every failed row
12. Continue import when possible
13. Generate an error report

---

## Invalid Date Handling

MySQL may contain invalid dates.

Convert these to null:

```txt
0000-00-00
0000-00-00 00:00:00
```

---

## Duplicate Handling

If a row with the same `old_id` already exists:

Default behavior:

```txt
Update existing record
```

Alternative behavior:

```txt
Skip duplicate
```

---

# 19. User Roles

Admins and managers can:

```txt
Import database
Create products
Edit products
Adjust prices
Bulk update prices
Manage stock
Deactivate products
View price history
View stock history
```

Cashiers/staff can:

```txt
View products
Sell products
View stock
View allowed selling price
```

Cashiers/staff cannot:

```txt
Import database
Bulk update prices
Delete products
Change buying price
Change lowest allowed price
```

---

# 20. Error Messages

Use simple, friendly messages.

```txt
Product name is required.
Selling price is required.
Selling price cannot be below the lowest allowed price.
Buying price cannot be negative.
Wholesale price cannot be negative.
Lowest allowed price cannot be negative.
Please add at least one variant.
Variant name is required.
SKU already exists.
Stock quantity cannot be negative.
This product could not be imported because its category is missing.
This stock row could not be imported because the product was not found.
The SQL file could not be read. Please upload a valid phpMyAdmin export.
```

---

# 21. Empty States

Use friendly empty states.

## No products

```txt
No products yet.
Start by adding your first product.
```

## No variants

```txt
No variants added yet.
Add sizes, colors, weights, or other options for this product.
```

## No price history

```txt
No price changes yet.
Price changes will appear here whenever prices are adjusted.
```

## No stock history

```txt
No stock changes yet.
Stock movement will appear here when stock is imported, sold, adjusted, or transferred.
```

---

# 22. Acceptance Criteria

The system is complete when:

```txt
Admin can upload old SQL dump.
System can detect required old tables.
System can show import preview.
System can import categories.
System can import subcategories.
System can import brands.
System can import units.
System can import warehouses.
System can import simple products.
System can import variable products.
System can import variants.
System can import product stock.
System preserves old IDs.
System handles duplicate imports safely.
System logs failed rows.
System can download import error report.
Admin can create a new normal product.
Admin can create a new variable product.
Admin can add variants to variable products.
Admin can adjust price for simple products.
Admin can adjust price for variants.
Admin can bulk update prices.
System records price history.
Admin can manage stock.
System records stock history.
Images display if available.
Missing images show placeholder.
Users see friendly labels, not database column names.
Users cannot sell below minimum price.
System works with PostgreSQL on Neon.
```

---

# 23. Suggested Build Order

Build in this order:

```txt
1. Create PostgreSQL tables
2. Create supporting data models
3. Create product model
4. Create variant model
5. Create stock model
6. Create price history model
7. Create migration log model
8. Build product APIs
9. Build product list UI
10. Build add/edit product form
11. Build variable product variant builder
12. Build price adjustment modal
13. Build bulk price update
14. Build stock management
15. Build import upload UI
16. Build SQL dump parser
17. Build import preview
18. Build import runner
19. Build error logging and report download
20. Test with old SQL dump
21. Fix failed mappings
22. Polish UI wording
```

---

# 24. Final Instruction for AI Builder

Build this as a production-ready module.

Prioritize:

```txt
No data loss
Correct import order
Safe old ID mapping
Simple staff-friendly UI
Reliable price handling
Reliable stock handling
Price history
Stock history
Import logs
PostgreSQL compatibility
Clean and maintainable code
```

Do not make the interface technical. The users are business/shop staff, not developers.

Use friendly labels everywhere:

```txt
Normal Product
Variable Product
Buying Price
Selling Price
Wholesale Price
Lowest Allowed Price
Stock Quantity
Warehouse
```

Avoid exposing technical names like:

```txt
cost_price
retail_price
variant_id
foreign key
old_id
```
