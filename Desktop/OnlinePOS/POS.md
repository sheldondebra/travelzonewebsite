# POS Interface Design Guide
## Social Commerce SaaS

Purpose:

Build a clean, modern POS-style checkout interface for fast product selection, customer selection, order creation, and payment tracking.

---

# Layout

```txt
┌───────────────────────────────┬───────────────────────────────┐
│ Checkout Panel                │ Product Panel                 │
│                               │                               │
│ Selected Customer             │ Search / Scan Product         │
│ Cart Items                    │ Category Filter               │
│ Tax / Discount / Shipping     │ Brand Filter                  │
│ Total Summary                 │ Product Grid/List             │
│ Pay Now                       │ Pagination                    │
└───────────────────────────────┴───────────────────────────────┘
```

---

# Header

```txt
Logo
Business Name
Online Status
Home
Recent Drafts
Reset
Hold
```

Example:

```txt
🔴 Novasoria
Online
```

---

# Search / Scan Product

Input placeholder:

```txt
Scan/Search Product by Code or Name
```

Search should support:

```txt
Product Code
Product Name
SKU
Barcode
Category
Brand
```

---

# Customer Selection

```txt
Select Customer
```

Features:

```txt
Search customer by name or phone
Create new customer quickly
View customer balance
View purchase history
```

---

# Checkout Panel

When no product is selected:

```txt
No items added
Select products from the right panel
```

When products are selected, show:

```txt
Product Name
Code
Quantity
Unit Price
Total
Remove Button
```

---

# Cart Controls

Each cart item should allow:

```txt
Increase quantity
Decrease quantity
Remove item
Edit price
Apply item discount
```

---

# Summary Section

Fields:

```txt
Tax
Discount
Shipping
Subtotal
Tax Amount
Discount Amount
Shipping Amount
Grand Total
```

Example:

```txt
Tax: 0%
Discount: ₵0
Shipping: ₵0

Subtotal: ₵0.00
Tax: ₵0.00
Discount: -₵0.00
Shipping: ₵0.00
Grand Total: ₵0.00
```

---

# Payment Section

```txt
Total Payable
₵ 0.00

Pay Now
```

Payment methods:

```txt
Cash
Mobile Money
Bank Transfer
Card
Pay Later
Partial Payment
```

---

# Product Panel

Title:

```txt
Available Products
```

Filters:

```txt
All Categories
All Brands
```

Product card/list item:

```txt
[medium] Satin with raffle
Code: 002
Stock: 1.00 pc
Price: ₵400.00
```

---

# Product Item Design

Each product item should display:

```txt
Product name
Product code
Available stock
Unit type
Price
Image optional
```

Recommended design:

```txt
White card
Rounded-xl
Soft border
Hover background
Click to add to cart
```

---

# Pagination

Example:

```txt
Page 1
171 products

1 2 … 18
```

---

# POS UI Colors

Primary brand color:

```txt
Baby Pink: #F8BBD0
```

Recommended palette:

```txt
Background: #FFF8F5
Card: #FFFFFF
Border: #F1E7E4
Text: #1F1F1F
Muted Text: #6B7280
Success: #22C55E
Warning: #F59E0B
Error: #EF4444
```

---

# UX Rules

The POS must be:

```txt
Fast
Simple
Keyboard-friendly
Touch-friendly
Mobile/tablet-ready
```

---

# Important Actions

```txt
Add product to cart
Remove product
Hold sale
Restore draft
Reset checkout
Select customer
Apply discount
Add shipping
Pay now
Print receipt
Share receipt
```

---

# Recommended Components

Use Shadcn UI:

```txt
Button
Input
Card
Table
Select
Dialog
Sheet
Badge
Separator
ScrollArea
```

Use icons from Lucide:

```txt
Search
ScanLine
ShoppingCart
User
Trash
Plus
Minus
CreditCard
Wallet
Truck
Receipt
RefreshCcw
PauseCircle
Home
```

---

# Desktop Layout

Desktop should use:

```txt
Left side: Checkout
Right side: Products
```

Recommended width:

```txt
Checkout Panel: 40%
Product Panel: 60%
```

---

# Tablet Layout

For iPad/tablet:

```txt
Checkout Panel: 45%
Product Panel: 55%
```

Use large buttons.

---

# Mobile Layout

For mobile:

```txt
Tabs:
1. Products
2. Cart
3. Payment
```

Bottom sticky button:

```txt
View Cart - ₵0.00
```

---

# Empty Cart State

```txt
No items added

Select products from the right panel
```

Use a soft cart icon.

---

# Payment Modal

When user clicks Pay Now, show:

```txt
Grand Total
Payment Method
Amount Paid
Payment Reference
Change Due
Complete Sale
```

---

# Receipt Flow

After payment:

```txt
Generate receipt
Download receipt
Print receipt
Share on WhatsApp
Send via SMS
```

---

# Data Needed

Product object:

```ts
type Product = {
  id: string;
  name: string;
  code: string;
  price: number;
  stockQuantity: number;
  unit: string;
  category?: string;
  brand?: string;
};
```

Cart item:

```ts
type CartItem = {
  productId: string;
  name: string;
  code: string;
  quantity: number;
  unitPrice: number;
  total: number;
};
```

Checkout summary:

```ts
type CheckoutSummary = {
  subtotal: number;
  taxPercent: number;
  taxAmount: number;
  discountAmount: number;
  shippingAmount: number;
  grandTotal: number;
};
```

---

# Final UI Goal

The interface should feel like:

```txt
Clean POS
Luxury boutique checkout
Fast social seller order system
Modern SaaS dashboard
```

Not like:

```txt
Old supermarket POS
Complicated ERP
Ugly admin panel
```