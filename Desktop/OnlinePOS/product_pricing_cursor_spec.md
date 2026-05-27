# Cursor Build Spec: Product & Pricing Management System

## Goal

Build a clean, user-friendly product management and pricing system for the new application.

The system must support:

1. Normal products / simple products
2. Variable products with sizes, colors, or options
3. Retail price, wholesale price, cost price, and minimum selling price
4. Stock tracking per product or per variant
5. Product images
6. Easy price adjustment
7. Price history tracking
8. A simple UI that non-technical users can understand

---

## Important Old Database Logic

The old system uses:

### `products`

This table stores the main product record.

Important old fields:

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

### `product_variants`

This table stores variant records for variable products.

Important old fields:

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

### `product_warehouse`

This table stores stock quantities.

Important old fields:

```txt
id
product_id
product_variant_id
warehouse_id
qte
manage_stock
```

---

## Product Types

### 1. Simple Product

A simple product has one price and one stock quantity.

Example:

```txt
Product: iPhone Charger
Cost Price: 50
Retail Price: 100
Wholesale Price: 85
Minimum Price: 70
Stock: 30
```

Rules:

```txt
products.type = "simple"
products.is_variant = false
```

Stock is connected directly to the product.

```txt
product_stock.product_id = product.id
product_stock.variant_id = null
```

---

### 2. Variable Product

A variable product has multiple options such as size, color, weight, or package type.

Example:

```txt
Product: T-Shirt

Variants:
- Small
- Medium
- Large
```

Each variant can have its own:

```txt
SKU / code
Cost price
Retail price
Wholesale price
Minimum price
Stock quantity
Image
```

Rules:

```txt
products.type = "variable"
products.is_variant = true
```

The parent product should not hold the final selling price. Prices must be stored on each variant.

---

## Recommended PostgreSQL Schema

Use this clean schema for the new app.

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
  category_id UUID,
  sub_category_id UUID,
  brand_id UUID,
  unit_id UUID,

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

  warehouse_id UUID,

  quantity NUMERIC(12, 2) DEFAULT 0,
  manage_stock BOOLEAN DEFAULT true,

  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now(),

  CONSTRAINT stock_unique_product_variant_warehouse UNIQUE (
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

## Pricing Rules

Apply these rules in the backend and UI.

### Required validations

```txt
Retail price must be greater than or equal to minimum price.
Wholesale price should be greater than or equal to cost price.
Minimum price should usually be greater than or equal to cost price.
Cost price cannot be negative.
Retail price cannot be negative.
Wholesale price cannot be negative.
Minimum price cannot be negative.
```

### Recommended validation logic

```ts
if (retailPrice < minimumPrice) {
  throw new Error("Retail price cannot be below the minimum selling price.");
}

if (wholesalePrice < costPrice) {
  showWarning("Wholesale price is below cost price. This may create a loss.");
}

if (minimumPrice < costPrice) {
  showWarning("Minimum price is below cost price. Staff may sell at a loss.");
}
```

---

## User-Friendly UI Requirements

The UI must be simple and easy for staff/admins.

---

## Product List Page

Create a page called:

```txt
Products
```

Features:

```txt
Search products by name, SKU, barcode, category, or brand
Filter by product type: All, Simple, Variable
Filter by status: Active, Inactive
Show stock status
Show retail price
Show wholesale price
Show product image
Edit product button
Adjust price button
View variants button for variable products
```

Table columns:

```txt
Image
Name
SKU
Type
Category
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

---

## Add Product Flow

Use a step-by-step form instead of one long confusing form.

### Step 1: Basic Information

Fields:

```txt
Product name
Product type: Simple or Variable
SKU / product code
Barcode
Category
Sub category
Brand
Unit
Description
Product image
```

User helper text:

```txt
Choose "Simple Product" if the product has only one version.
Choose "Variable Product" if the product has sizes, colors, weights, or package options.
```

---

### Step 2A: Pricing for Simple Product

Show this only when product type is simple.

Fields:

```txt
Cost price
Retail selling price
Wholesale price
Minimum selling price
```

Helper labels:

```txt
Cost price = how much you bought the product for.
Retail price = normal selling price.
Wholesale price = price for bulk or wholesale customers.
Minimum price = lowest price staff are allowed to sell.
```

---

### Step 2B: Variants for Variable Product

Show this only when product type is variable.

Allow admin to add many variants.

Each variant row must include:

```txt
Variant name
SKU / code
Cost price
Retail price
Wholesale price
Minimum price
Variant image
Initial stock
```

Example UI:

```txt
Product: T-Shirt

Variants:
[ Small  | SKU001-S | Cost | Retail | Wholesale | Min | Stock ]
[ Medium | SKU001-M | Cost | Retail | Wholesale | Min | Stock ]
[ Large  | SKU001-L | Cost | Retail | Wholesale | Min | Stock ]
```

Buttons:

```txt
Add Variant
Duplicate Variant
Remove Variant
```

---

### Step 3: Stock

For simple products:

```txt
Opening stock
Warehouse
Stock alert quantity
Manage stock: yes/no
```

For variable products:

```txt
Stock is entered per variant.
```

---

### Step 4: Review & Save

Before saving, show a summary:

```txt
Product name
Product type
Price summary
Variant count
Stock summary
Image preview
```

Buttons:

```txt
Back
Save Product
Save & Add Another
```

---

## Price Adjustment Feature

Create a page or modal called:

```txt
Adjust Product Price
```

The user should be able to update prices without editing the full product.

---

## Simple Product Price Adjustment

Fields:

```txt
Current cost price
New cost price

Current retail price
New retail price

Current wholesale price
New wholesale price

Current minimum price
New minimum price

Reason for change
```

On save:

1. Update the product price fields
2. Insert records into `product_price_history`
3. Show success message

Success message:

```txt
Price updated successfully.
```

---

## Variable Product Price Adjustment

For variable products, show a table of variants.

Columns:

```txt
Variant
Current cost
New cost
Current retail
New retail
Current wholesale
New wholesale
Current minimum
New minimum
Reason
```

Allow:

```txt
Update one variant
Update multiple variants at once
Apply same price to all variants
Increase all retail prices by percentage
Increase all retail prices by fixed amount
```

Useful actions:

```txt
Add 10% to all retail prices
Add fixed amount to all retail prices
Set same wholesale price for all variants
Set same minimum price for all variants
```

---

## Bulk Pricing Tools

Create a bulk price adjustment feature.

Admin can select:

```txt
Category
Brand
Product type
Selected products
```

Adjustment methods:

```txt
Increase retail price by percentage
Decrease retail price by percentage
Increase retail price by fixed amount
Decrease retail price by fixed amount
Set wholesale price
Set minimum price
```

Before applying, show preview:

```txt
Old price
New price
Difference
Affected products count
```

Require confirmation:

```txt
You are about to update prices for 24 products. This action will be recorded in price history.
```

---

## Migration Rules from Old Database

When migrating old data:

### If old product is normal

Old condition:

```txt
products.is_variant = 0
```

New condition:

```txt
products.type = "simple"
```

Map pricing:

```txt
old products.cost              -> products.cost_price
old products.price             -> products.retail_price
old products.wholesale_price   -> products.wholesale_price
old products.min_price         -> products.minimum_price
```

---

### If old product is variable

Old condition:

```txt
products.is_variant = 1
```

New condition:

```txt
products.type = "variable"
```

Parent product:

```txt
old products.id      -> products.old_id
old products.name    -> products.name
old products.code    -> products.sku
old products.image   -> products.image_url
```

Child variants:

```txt
old product_variants.id        -> product_variants.old_id
old product_variants.product_id -> product_variants.product_id through old_id mapping
old product_variants.name      -> product_variants.name
old product_variants.code      -> product_variants.sku
old product_variants.cost      -> product_variants.cost_price
old product_variants.price     -> product_variants.retail_price
old product_variants.wholesale -> product_variants.wholesale_price
old product_variants.min_price -> product_variants.minimum_price
```

---

### Stock migration

For simple products:

```txt
old product_warehouse.product_id -> new product_stock.product_id
old product_warehouse.product_variant_id = null
old product_warehouse.qte -> product_stock.quantity
```

For variable products:

```txt
old product_warehouse.product_id -> new product_stock.product_id
old product_warehouse.product_variant_id -> new product_stock.variant_id
old product_warehouse.qte -> product_stock.quantity
```

---

## Image Migration

The old database likely stores only image paths, not the real files.

Example:

```txt
/products/image-name.jpg
/uploads/product/image-name.jpg
```

The app must support image migration by:

1. Keeping old image path in `image_url`
2. Allowing a storage migration later
3. Supporting new image uploads
4. Showing a placeholder image if the old image file is missing

Recommended image logic:

```ts
function getProductImage(imageUrl?: string) {
  if (!imageUrl) return "/placeholder-product.png";

  if (imageUrl.startsWith("http")) return imageUrl;

  return `${process.env.NEXT_PUBLIC_OLD_IMAGE_BASE_URL}/${imageUrl}`;
}
```

Environment variable:

```txt
NEXT_PUBLIC_OLD_IMAGE_BASE_URL=https://old-domain.com
```

---

## API Endpoints

Create these endpoints.

### Products

```txt
GET    /api/products
GET    /api/products/:id
POST   /api/products
PATCH  /api/products/:id
DELETE /api/products/:id
```

### Variants

```txt
GET    /api/products/:id/variants
POST   /api/products/:id/variants
PATCH  /api/product-variants/:variantId
DELETE /api/product-variants/:variantId
```

### Pricing

```txt
POST   /api/products/:id/adjust-price
POST   /api/product-variants/:variantId/adjust-price
POST   /api/products/bulk-adjust-price
GET    /api/products/:id/price-history
```

### Stock

```txt
GET    /api/products/:id/stock
PATCH  /api/products/:id/stock
PATCH  /api/product-variants/:variantId/stock
```

---

## Frontend Components

Build reusable components:

```txt
ProductForm
ProductTypeSelector
SimpleProductPricingForm
VariantBuilder
VariantPricingTable
StockForm
ProductImageUpload
PriceAdjustmentModal
BulkPriceAdjustmentModal
PriceHistoryTable
ProductListTable
ProductSearchFilters
```

---

## UX Details

Make the system easy for users.

Use friendly wording:

```txt
Normal Product
Variable Product
Buying Price
Selling Price
Wholesale Price
Lowest Allowed Price
```

Avoid technical wording like:

```txt
cost_price
retail_price
variant_id
foreign key
```

Show helpful hints beside each price field.

Example:

```txt
Buying Price: The amount you paid to buy this item.
Selling Price: The normal price customers pay.
Wholesale Price: Price for bulk buyers.
Lowest Allowed Price: Staff cannot sell below this amount.
```

---

## Form Validation Messages

Use these messages:

```txt
Product name is required.
Selling price is required.
Selling price cannot be below the lowest allowed price.
Buying price cannot be negative.
Wholesale price cannot be negative.
Add at least one variant for a variable product.
Variant name is required.
SKU already exists.
Stock quantity cannot be negative.
```

---

## Empty States

If no products exist:

```txt
No products yet.
Start by adding your first product.
[Add Product]
```

If a variable product has no variants:

```txt
No variants added.
Add sizes, colors, or other options for this product.
[Add Variant]
```

If there is no price history:

```txt
No price changes yet.
Price changes will appear here when you adjust prices.
```

---

## Permissions

Only admins or managers should be able to:

```txt
Create products
Edit products
Adjust prices
Bulk adjust prices
Delete/deactivate products
```

Cashiers or sales staff can:

```txt
View products
Sell products
See allowed selling prices
```

---

## Important Developer Notes

1. Do not delete products permanently. Use soft delete with `deleted_at`.
2. Do not lose old IDs. Store them in `old_id`.
3. Do not overwrite price changes without recording history.
4. Variable product prices must live on variants.
5. Simple product prices must live on the product.
6. Stock for variants must reference `variant_id`.
7. Stock for simple products must have `variant_id = null`.
8. Always validate minimum price before saving.
9. Always show price warnings clearly.
10. Make the UI easy enough for a shop worker to use without training.

---

## Acceptance Criteria

The feature is complete when:

```txt
Admin can create a simple product.
Admin can create a variable product with multiple variants.
Admin can add prices for each variant.
Admin can adjust prices later.
Admin can bulk adjust prices.
Admin can see price history.
Admin can track stock for simple products.
Admin can track stock per variant.
Product images display correctly.
Missing images show placeholder.
Old migrated IDs are stored.
Old product pricing maps correctly.
Users cannot sell below minimum price.
The UI uses friendly labels instead of database field names.
```

---

## Suggested Build Order

1. Create database tables
2. Create product API endpoints
3. Create product list page
4. Create add/edit simple product form
5. Create variable product variant builder
6. Create stock management
7. Create price adjustment modal
8. Create price history table
9. Create bulk price adjustment tool
10. Add migration script from old database
11. Test with old product data
12. Improve UI wording and validation

---

## Final Instruction for Cursor

Build this as a production-ready product and pricing module.

Prioritize:

```txt
Data safety
Simple UI
Accurate pricing
No loss of migrated data
Clean code
Clear validation
Price history
Easy stock management
```

Do not make the interface complicated. The target users are shop/business staff, not developers.
