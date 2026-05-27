# POS Implementation Guide
## Social Commerce SaaS / Novasoria POS

Goal:

Build a modern POS system for social commerce sellers with:

```txt
Fast checkout
Inventory tracking
Customer selection
Payments
Receipts
Refunds
Cash drawer sessions
Staff roles
Reports
```

---

# 1. CORE POS MODULES

Build the POS in these modules:

```txt
Register
Cart
Products
Customers
Payments
Receipts
Orders
Refunds
Cash Drawer
Reports
Staff Permissions
```

---

# 2. POS PAGE LAYOUT

```txt
src/app/dashboard/pos/page.tsx
```

Layout:

```txt
┌──────────────────────────────┬──────────────────────────────┐
│ Checkout / Cart              │ Products                     │
│                              │                              │
│ Customer                     │ Search / Scan                │
│ Cart Items                   │ Categories / Brands          │
│ Tax / Discount / Shipping    │ Product List                 │
│ Total                        │ Pagination                   │
│ Payment                      │                              │
└──────────────────────────────┴──────────────────────────────┘
```

---

# 3. FILE STRUCTURE

```txt
src/
├── app/
│   └── dashboard/
│       └── pos/
│           └── page.tsx
│
├── components/
│   └── pos/
│       ├── PosLayout.tsx
│       ├── ProductSearch.tsx
│       ├── ProductGrid.tsx
│       ├── ProductCard.tsx
│       ├── CartPanel.tsx
│       ├── CartItem.tsx
│       ├── CustomerSelector.tsx
│       ├── CheckoutSummary.tsx
│       ├── PaymentModal.tsx
│       ├── ReceiptModal.tsx
│       ├── HoldSaleModal.tsx
│       ├── RefundModal.tsx
│       └── CashDrawerModal.tsx
│
├── actions/
│   └── pos/
│       ├── create-sale.ts
│       ├── hold-sale.ts
│       ├── process-payment.ts
│       ├── create-refund.ts
│       └── close-register.ts
│
├── server/
│   └── services/
│       ├── pos-service.ts
│       ├── cart-service.ts
│       ├── inventory-service.ts
│       ├── payment-service.ts
│       ├── receipt-service.ts
│       └── cash-drawer-service.ts
```

---

# 4. POS DATABASE MODELS

Add these models:

```prisma
model RegisterSession {
  id             String   @id @default(cuid())
  businessId     String
  cashierId      String

  openingFloat   Float
  expectedCash   Float    @default(0)
  countedCash    Float?
  difference     Float?

  status         String   @default("OPEN")

  openedAt       DateTime @default(now())
  closedAt       DateTime?
}
```

```prisma
model Sale {
  id              String   @id @default(cuid())
  businessId      String
  customerId      String?
  cashierId       String
  registerId      String?

  subtotal        Float
  taxAmount       Float
  discountAmount  Float
  shippingAmount  Float
  grandTotal      Float
  amountPaid      Float
  changeDue       Float   @default(0)

  paymentStatus   String
  deliveryStatus  String
  status          String  @default("COMPLETED")

  createdAt       DateTime @default(now())

  items           SaleItem[]
  payments        SalePayment[]
}
```

```prisma
model SaleItem {
  id          String @id @default(cuid())

  saleId      String
  productId   String

  name        String
  sku         String?
  quantity    Int
  unitPrice   Float
  costPrice   Float
  discount    Float @default(0)
  total       Float
  profit      Float
}
```

```prisma
model SalePayment {
  id          String @id @default(cuid())

  saleId      String
  method      String
  amount      Float
  reference   String?
  network     String?

  createdAt   DateTime @default(now())
}
```

```prisma
model Refund {
  id          String @id @default(cuid())

  saleId      String
  businessId  String
  cashierId   String

  amount      Float
  reason      String
  method      String
  status      String @default("COMPLETED")

  restock     Boolean @default(true)

  createdAt   DateTime @default(now())
}
```

```prisma
model CashMovement {
  id          String @id @default(cuid())

  businessId  String
  registerId  String
  cashierId   String

  type        String
  amount      Float
  reason      String

  createdAt   DateTime @default(now())
}
```

---

# 5. PRODUCT SEARCH / SCAN

Search input:

```txt
Scan/Search Product by Code or Name
```

Search by:

```txt
Product name
SKU
Barcode
Code
Category
Brand
```

Behavior:

```txt
If exact barcode match:
  Add product to cart automatically

If name search:
  Filter products list

If no product:
  Show "Product not found"
```

---

# 6. CART FEATURES

Cart item must support:

```txt
Increase quantity
Decrease quantity
Remove item
Edit quantity
Line discount
Price override with permission
Stock validation
```

Cart empty state:

```txt
No items added
Select products from the right panel
```

---

# 7. CHECKOUT SUMMARY

Fields:

```txt
Subtotal
Tax
Discount
Shipping
Grand Total
Total Payable
```

Calculations:

```txt
subtotal = sum(cart item totals)

taxAmount = subtotal * taxPercent / 100

grandTotal = subtotal + taxAmount + shippingAmount - discountAmount
```

---

# 8. PAYMENT MODAL

Payment methods:

```txt
Cash
Mobile Money
Bank Transfer
Card
Pay Later
Split Payment
```

Payment modal fields:

```txt
Grand Total
Payment Method
Amount Paid
Payment Reference
MoMo Network
Change Due
Complete Sale
```

---

# 9. SPLIT PAYMENT

Support multiple payment methods per sale.

Example:

```txt
Cash: ₵200
MoMo: ₵150
Total: ₵350
```

Store each payment in:

```txt
SalePayment
```

---

# 10. CASH PAYMENT LOGIC

If payment method is cash:

```txt
amountPaid > grandTotal
```

Calculate:

```txt
changeDue = amountPaid - grandTotal
```

---

# 11. HOLD SALE / DRAFTS

Allow cashier to hold a sale.

Use for:

```txt
Customer is not ready
Customer wants to add more items
Payment is pending
```

Sale status:

```txt
DRAFT
HELD
COMPLETED
VOIDED
REFUNDED
```

---

# 12. REGISTER SESSION

Before selling, cashier must open register.

Open register fields:

```txt
Opening float
Cashier
Register name
Opening note
```

Close register fields:

```txt
Counted cash
Expected cash
Difference
Closing note
```

---

# 13. CASH MOVEMENTS

Track:

```txt
Cash In
Cash Out
Petty Cash
Owner Withdrawal
Expense From Till
```

Types:

```txt
CASH_IN
CASH_OUT
```

---

# 14. X-REPORT / Z-REPORT

## X-Report

Current register summary without closing.

Show:

```txt
Total Sales
Cash Sales
MoMo Sales
Card Sales
Refunds
Discounts
Expected Cash
```

## Z-Report

End-of-day report that closes register.

Show:

```txt
Opening Float
Cash Sales
Cash In
Cash Out
Expected Cash
Counted Cash
Difference
Total Sales
Refunds
Net Sales
```

---

# 15. REFUNDS / RETURNS

Order detail page must include:

```txt
Refund
Return
Exchange
Void
Reprint Receipt
```

Refund modal fields:

```txt
Refund amount
Refund reason
Refund method
Restock item?
Manager approval
```

Return reasons:

```txt
Wrong Size
Wrong Product
Damaged
Customer Changed Mind
Other
```

---

# 16. INVENTORY RULES

When sale is completed:

```txt
Reduce stock
Save inventory movement
Calculate profit
Save sale item snapshot
```

When refund with restock is completed:

```txt
Increase stock
Save inventory movement
Mark item returned
```

---

# 17. INVENTORY MOVEMENT LOG

Create movement for:

```txt
Sale
Refund
Stock Adjustment
Transfer
Damage
Restock
```

Fields:

```txt
productId
businessId
type
quantity
reason
referenceId
createdBy
```

---

# 18. RECEIPT SYSTEM

Receipt should support:

```txt
Logo
Business name
Cashier name
Customer name
Items
Tax
Discount
Shipping
Payment method
Change due
Receipt number
Date/time
Footer message
```

Receipt actions:

```txt
Print
Download PDF
Share WhatsApp
Send SMS
Send Email
Reprint
```

---

# 19. RECEIPT SETTINGS

Create settings page:

```txt
/dashboard/settings/receipt
```

Settings:

```txt
Logo
Receipt footer
Paper size: 58mm / 80mm / A4
Show tax breakdown
Show cashier name
Show customer phone
Duplicate watermark for reprint
```

---

# 20. TAX SETTINGS

For Ghana support:

```txt
VAT
NHIL
GETFund
COVID Levy
```

Allow:

```txt
Tax inclusive pricing
Tax exclusive pricing
Tax exempt products
Tax exempt customers
```

---

# 21. STAFF ROLES

Roles:

```txt
Owner
Manager
Cashier
Sales Staff
Delivery
```

Permissions:

```txt
Can create sale
Can refund sale
Can void sale
Can apply discount
Can override price
Can close register
Can view reports
```

---

# 22. CASHIER PIN LOGIN

POS should support quick staff switching:

```txt
Enter PIN
Switch cashier
Continue selling
```

---

# 23. AUDIT LOGS

Track important actions:

```txt
Sale created
Sale voided
Refund created
Discount applied
Price overridden
Register opened
Register closed
Cash removed
```

---

# 24. HARDWARE SUPPORT

Future integrations:

```txt
Thermal printer
Cash drawer
Barcode scanner
Customer display
Label printer
```

Start with browser print first.

Later add:

```txt
ESC/POS printing
```

---

# 25. OFFLINE MODE

Important for Ghana.

Offline support should allow:

```txt
Create sale offline
Store locally
Sync when online
Prevent duplicate sync
Show sync status
```

Use:

```txt
IndexedDB
Service Worker
Background Sync
```

---

# 26. MOBILE / TABLET POS

Desktop:

```txt
Left: Cart
Right: Products
```

Tablet:

```txt
Split screen
Large buttons
Touch-friendly cards
```

Mobile:

```txt
Tabs:
Products
Cart
Payment
```

---

# 27. UI STYLE

Design feel:

```txt
Clean
Modern
Classy
Fast
Boutique POS
Luxury SaaS
```

Colors:

```txt
Primary: #F8BBD0
Background: #FFF8F5
Card: #FFFFFF
Border: #F1E7E4
Text: #1F1F1F
Muted: #6B7280
Success: #22C55E
Error: #EF4444
```

---

# 28. ICONS

Use Lucide icons:

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
Printer
RotateCcw
Banknote
```

---

# 29. API ROUTES

Create:

```txt
/api/pos/products
/api/pos/customers
/api/pos/sales
/api/pos/sales/hold
/api/pos/sales/refund
/api/pos/payments
/api/pos/register/open
/api/pos/register/close
/api/pos/register/report
/api/pos/receipt
```

---

# 30. IMPLEMENTATION ORDER

## Step 1

```txt
POS layout
Product search
Product list
Cart add/remove
```

## Step 2

```txt
Customer selection
Tax
Discount
Shipping
Grand total
```

## Step 3

```txt
Complete sale
Reduce stock
Save sale
Save sale items
```

## Step 4

```txt
Payment modal
Cash/MoMo/Card/Bank
Split payment
Change due
```

## Step 5

```txt
Receipts
Print receipt
View receipt
Reprint receipt
```

## Step 6

```txt
Hold sale
Recent drafts
Restore held sale
Reset cart
```

## Step 7

```txt
Open register
Close register
Cash in/out
X/Z reports
```

## Step 8

```txt
Refunds
Returns
Void sale
Restock returned items
```

## Step 9

```txt
Staff roles
Cashier PIN
Manager override
Audit logs
```

## Step 10

```txt
Offline mode
Hardware support
Advanced reports
```

---

# 31. MVP POS SCOPE

Build first:

```txt
Product search
Cart
Customer
Tax/discount/shipping
Payment
Receipt
Inventory deduction
Held sales
```

Do NOT build first:

```txt
Hardware printer
Offline sync
Advanced tax engine
Loyalty
Customer display
```

---

# 32. FINAL GOAL

The POS should help sellers answer:

```txt
What did I sell?
Who bought it?
How was I paid?
What stock reduced?
How much profit did I make?
What receipt was issued?
Which cashier handled it?
```

The POS should feel:

```txt
Fast enough for retail.
Simple enough for social sellers.
Classy enough for premium brands.
Powerful enough for real business.
```