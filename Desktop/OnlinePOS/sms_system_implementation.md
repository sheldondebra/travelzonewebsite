# SMS System Implementation Guide
## Social Commerce SaaS / POS Platform
### Provider: SplitSMS
### Owner: General Office

This document is for Cursor implementation.

Goal:

Build a complete SMS system for the POS and social commerce SaaS platform using:

```txt
SplitSMS Provider
General Office SMS Control
Client Sender ID Setup
SMS Wallet / Packages
Receipt SMS
Delivery SMS
Rider SMS
Customer SMS
Admin Notifications
```

The current application already has POS, products, orders, people, reports, expenses, tasks, analytics, settings, payment methods, POS settings, modules, devices, warehouses, currency, backup, security, business settings, SMS/mail/templates, gateway settings, and upgrade sections. It also already supports payment methods like Cash, Mobile Money, Bank Transfer, Card, and Pay Later, plus receipt printing/viewing and SMS/email receipt areas. This SMS module should connect into those existing areas instead of becoming a separate isolated feature.

---

# 1. MAIN SMS GOAL

The SMS system should help businesses send important messages automatically.

Use SMS for:

```txt
Receipt SMS
Payment Confirmation SMS
Order Confirmation SMS
Delivery Updates
Rider Assignment SMS
Low Stock Alerts
Customer Balance Reminders
Pay Later Reminders
Refund Notifications
Staff Alerts
Owner Daily Sales Summary
```

The system should work like this:

```txt
General Office configures SplitSMS
        ↓
General Office creates SMS packages
        ↓
Client buys SMS credits/package
        ↓
Client requests Sender ID
        ↓
General Office approves/denies Sender ID
        ↓
System sends SMS automatically from approved Sender ID
```

---

# 2. USER ROLES

## General Office

General Office is the platform owner/admin.

Can:

```txt
Configure SplitSMS API keys
Create SMS packages
Seed default SMS packages
Approve Sender IDs
Deny Sender IDs
View all SMS usage
View failed SMS
View all client SMS balances
Configure SMS pricing
Configure payment gateway for SMS purchases
Manually credit/debit SMS balances
Suspend SMS access
```

## Client / Business Admin

Client means the business using the SaaS platform.

Can:

```txt
Request Sender ID
View Sender ID status
Buy SMS packages
View SMS balance
Enable/disable SMS automations
Edit SMS templates
View SMS logs for their business
Send manual SMS to customers
```

## Staff / Cashier

Can:

```txt
Send receipt SMS after sale
Send order confirmation SMS
Send delivery update SMS if permitted
```

## Rider

Can trigger or receive:

```txt
Delivery assignment SMS
Customer delivery SMS
Delivery completed SMS
Failed delivery SMS
```

---

# 3. SENDER ID FLOW

During onboarding or business setup, allow client to set Sender ID.

Example Sender ID:

```txt
NOVASORIA
GLAMCLOSET
TECUNIT
```

## Sender ID Statuses

```txt
PENDING
APPROVED
DENIED
```

## Rules

```txt
New Sender ID request starts as PENDING
Only General Office can approve or deny
SMS cannot use pending Sender ID
If denied, client can request another Sender ID
If no approved Sender ID exists, use platform fallback Sender ID
```

---

# 4. SMS PROVIDER

Provider:

```txt
www.splitsms.com
```

Use SplitSMS as the primary SMS gateway.

Create a provider abstraction so the platform can support more SMS providers later.

Recommended structure:

```txt
SplitSMSProvider
HubtelSMSProvider
AfricaTalkingProvider
MNotifyProvider
ArkeselProvider
```

Do not hardcode SplitSMS everywhere.

Use:

```ts
SmsProviderInterface
```

---

# 5. DATABASE MODELS

Add these Prisma models.

---

## SmsProviderConfig

For General Office only.

```prisma
model SmsProviderConfig {
  id          String   @id @default(cuid())
  provider    String   @default("SPLITSMS")
  baseUrl     String
  apiKey      String
  username    String?
  password    String?
  senderId    String?
  isActive    Boolean  @default(true)

  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}
```

---

## BusinessSenderId

```prisma
model BusinessSenderId {
  id          String   @id @default(cuid())
  businessId  String
  senderId    String
  status      String   @default("PENDING")
  reason      String?

  requestedBy String?
  reviewedBy  String?
  reviewedAt  DateTime?

  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  @@index([businessId])
  @@index([status])
}
```

---

## SmsPackage

General Office creates and manages packages.

```prisma
model SmsPackage {
  id          String   @id @default(cuid())
  name        String
  smsCount    Int
  price       Float
  currency    String   @default("GHS")
  isActive    Boolean  @default(true)
  sortOrder   Int      @default(0)

  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}
```

---

## BusinessSmsWallet

Each business has an SMS wallet.

```prisma
model BusinessSmsWallet {
  id          String   @id @default(cuid())
  businessId  String   @unique
  balance     Int      @default(0)

  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}
```

---

## SmsPurchase

Tracks package purchases.

```prisma
model SmsPurchase {
  id              String   @id @default(cuid())
  businessId      String
  packageId       String
  smsCount        Int
  amount          Float
  currency        String   @default("GHS")
  paymentStatus   String   @default("PENDING")
  paymentMethod   String?
  paymentReference String?

  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  @@index([businessId])
  @@index([paymentStatus])
}
```

---

## SmsTemplate

Templates can be global or business-specific.

```prisma
model SmsTemplate {
  id          String   @id @default(cuid())
  businessId  String?
  key         String
  title       String
  message     String
  isActive    Boolean  @default(true)

  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  @@index([businessId])
  @@index([key])
}
```

---

## SmsLog

Track every SMS.

```prisma
model SmsLog {
  id              String   @id @default(cuid())
  businessId      String?
  recipient       String
  senderId        String?
  message         String
  category        String
  status          String   @default("PENDING")
  provider        String   @default("SPLITSMS")
  providerMessageId String?
  providerResponse  Json?
  errorMessage    String?
  smsUnits        Int      @default(1)
  cost            Float?

  relatedType     String?
  relatedId       String?

  sentAt          DateTime?
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  @@index([businessId])
  @@index([status])
  @@index([category])
  @@index([recipient])
}
```

---

## SmsAutomationSetting

```prisma
model SmsAutomationSetting {
  id          String   @id @default(cuid())
  businessId  String
  key         String
  enabled     Boolean  @default(true)

  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  @@unique([businessId, key])
}
```

---

# 6. SEED SMS PACKAGES

Seed default SMS packages for General Office.

```ts
const smsPackages = [
  {
    name: "Starter SMS",
    smsCount: 100,
    price: 25,
    currency: "GHS",
    sortOrder: 1,
  },
  {
    name: "Growth SMS",
    smsCount: 500,
    price: 100,
    currency: "GHS",
    sortOrder: 2,
  },
  {
    name: "Business SMS",
    smsCount: 1000,
    price: 180,
    currency: "GHS",
    sortOrder: 3,
  },
  {
    name: "Enterprise SMS",
    smsCount: 5000,
    price: 800,
    currency: "GHS",
    sortOrder: 4,
  },
];
```

General Office should be able to edit these later.

---

# 7. SMS CATEGORIES

Use categories for logs and reports.

```txt
RECEIPT
ORDER_CONFIRMATION
PAYMENT_CONFIRMATION
DELIVERY_ASSIGNMENT
DELIVERY_UPDATE
RIDER_NOTIFICATION
REFUND
PAY_LATER_REMINDER
LOW_STOCK
DAILY_SUMMARY
MANUAL
SECURITY
MARKETING
```

---

# 8. SMS TEMPLATES

Use placeholders.

Format:

```txt
{{businessName}}
{{customerName}}
{{orderNumber}}
{{amount}}
{{paymentMethod}}
{{deliveryStatus}}
{{riderName}}
{{riderPhone}}
{{receiptLink}}
{{date}}
```

---

# 9. DEFAULT SMS TEMPLATES

## Receipt SMS

```txt
Thank you for shopping with {{businessName}}. Receipt No: {{receiptNumber}}. Amount paid: GHS {{amount}}. View receipt: {{receiptLink}}
```

## Order Confirmation SMS

```txt
Hi {{customerName}}, your order {{orderNumber}} from {{businessName}} has been received. Total: GHS {{amount}}. Thank you.
```

## Payment Confirmation SMS

```txt
Payment received for order {{orderNumber}}. Amount: GHS {{amount}} via {{paymentMethod}}. Thank you for choosing {{businessName}}.
```

## Delivery Assignment SMS to Rider

```txt
New delivery assigned. Order: {{orderNumber}}. Customer: {{customerName}}. Phone: {{customerPhone}}. Address: {{deliveryAddress}}. Fee: GHS {{deliveryFee}}.
```

## Delivery Update SMS to Customer

```txt
Hi {{customerName}}, your order {{orderNumber}} from {{businessName}} is now {{deliveryStatus}}. Rider: {{riderName}} {{riderPhone}}.
```

## Delivered SMS

```txt
Your order {{orderNumber}} from {{businessName}} has been delivered. Thank you for shopping with us.
```

## Refund SMS

```txt
Refund processed for order {{orderNumber}}. Amount: GHS {{amount}}. Reason: {{reason}}. {{businessName}}
```

## Pay Later Reminder SMS

```txt
Hi {{customerName}}, you have a pending balance of GHS {{amount}} for order {{orderNumber}} at {{businessName}}. Kindly complete payment. Thank you.
```

## Low Stock SMS to Owner

```txt
Low stock alert: {{productName}} has only {{stockQuantity}} {{unit}} left. Please restock soon.
```

## Daily Sales Summary SMS to Owner

```txt
{{businessName}} Daily Summary: Sales GHS {{sales}}, Profit GHS {{profit}}, Orders {{orders}}, Expenses GHS {{expenses}}.
```

---

# 10. WHEN SMS SHOULD SEND

## On Successful POS Payment

Trigger:

```txt
Sale completed successfully
Payment status = PAID
```

Action:

```txt
Send receipt SMS to customer
Send payment confirmation SMS if enabled
Deduct SMS unit from business wallet
Save SMS log
```

---

## On Order Created

Trigger:

```txt
Order created from POS, dashboard, or mobile app
```

Action:

```txt
Send order confirmation SMS
```

---

## On Delivery Assigned

Trigger:

```txt
Delivery rider assigned to order
```

Action:

```txt
Send rider assignment SMS to rider
Send delivery update SMS to customer
```

---

## On Delivery Status Updated

Trigger statuses:

```txt
PROCESSING
OUT_FOR_DELIVERY
DELIVERED
FAILED
RETURNED
```

Action:

```txt
Send delivery status SMS to customer
```

---

## On Refund

Trigger:

```txt
Refund completed
```

Action:

```txt
Send refund SMS
```

---

## On Low Stock

Trigger:

```txt
Product stock quantity <= low stock threshold
```

Action:

```txt
Send low stock SMS to owner/admin
```

---

## On Pay Later Due

Trigger:

```txt
Pay later order still unpaid after configured days
```

Action:

```txt
Send customer payment reminder SMS
```

---

# 11. SMS WALLET RULES

Before sending SMS:

```txt
Check business SMS balance
Check sender ID approval
Check automation setting
Check recipient phone number
Check template is active
```

If balance is 0:

```txt
Do not send SMS
Save failed SMS log
Notify business admin to buy SMS
```

If Sender ID is pending:

```txt
Use fallback platform Sender ID or block SMS depending on General Office settings
```

Recommended:

```txt
Use fallback Sender ID for transactional SMS
Block marketing SMS until Sender ID is approved
```

---

# 12. SMS UNIT CALCULATION

SMS length rules:

```txt
1 SMS unit = 160 characters
2 SMS units = 161 to 320 characters
3 SMS units = 321 to 480 characters
```

Create helper:

```ts
export function calculateSmsUnits(message: string) {
  return Math.ceil(message.length / 160);
}
```

Deduct units from wallet after provider accepts SMS.

---

# 13. SPLITSMS PROVIDER SERVICE

Create:

```txt
src/server/services/sms/providers/splitsms-provider.ts
```

Example interface:

```ts
export type SendSmsPayload = {
  to: string;
  message: string;
  senderId: string;
};

export type SendSmsResponse = {
  success: boolean;
  providerMessageId?: string;
  raw?: unknown;
  error?: string;
};

export interface SmsProvider {
  send(payload: SendSmsPayload): Promise<SendSmsResponse>;
}
```

SplitSMS implementation:

```ts
export class SplitSmsProvider implements SmsProvider {
  constructor(
    private config: {
      baseUrl: string;
      apiKey: string;
      username?: string;
      password?: string;
    }
  ) {}

  async send(payload: SendSmsPayload): Promise<SendSmsResponse> {
    try {
      const response = await fetch(this.config.baseUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${this.config.apiKey}`,
        },
        body: JSON.stringify({
          sender: payload.senderId,
          recipient: payload.to,
          message: payload.message,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        return {
          success: false,
          raw: data,
          error: data?.message || "SplitSMS request failed",
        };
      }

      return {
        success: true,
        providerMessageId: data?.message_id || data?.id,
        raw: data,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown SMS error",
      };
    }
  }
}
```

IMPORTANT:

Confirm the exact SplitSMS API endpoint and request format from their documentation/dashboard, then update the payload keys.

---

# 14. SMS SERVICE

Create:

```txt
src/server/services/sms/sms-service.ts
```

Responsibilities:

```txt
Load provider config
Resolve Sender ID
Render template
Calculate SMS units
Check wallet balance
Send SMS
Deduct wallet balance
Save SMS log
Handle failures
```

Pseudo flow:

```ts
async function sendBusinessSms({
  businessId,
  recipient,
  templateKey,
  variables,
  category,
  relatedType,
  relatedId,
}) {
  const wallet = await getSmsWallet(businessId);
  const template = await getSmsTemplate(businessId, templateKey);
  const senderId = await resolveSenderId(businessId);
  const message = renderTemplate(template.message, variables);
  const smsUnits = calculateSmsUnits(message);

  if (wallet.balance < smsUnits) {
    return createFailedSmsLog("Insufficient SMS balance");
  }

  const response = await provider.send({
    to: recipient,
    message,
    senderId,
  });

  if (response.success) {
    await deductSmsBalance(businessId, smsUnits);
    await createSmsLog({ status: "SENT" });
  } else {
    await createSmsLog({ status: "FAILED" });
  }
}
```

---

# 15. CONNECT SMS TO POS PAYMENT

In POS payment completion logic:

```txt
src/actions/pos/process-payment.ts
```

After payment succeeds:

```ts
await sendBusinessSms({
  businessId: sale.businessId,
  recipient: customer.phone,
  templateKey: "RECEIPT_SMS",
  category: "RECEIPT",
  relatedType: "SALE",
  relatedId: sale.id,
  variables: {
    businessName: business.name,
    customerName: customer.name,
    receiptNumber: sale.receiptNumber,
    amount: sale.grandTotal,
    receiptLink: receiptUrl,
  },
});
```

Rules:

```txt
Only send if customer phone exists
Only send if receipt SMS automation is enabled
Only send if payment status is PAID
```

---

# 16. CONNECT SMS TO DELIVERY

On rider assignment:

```ts
await sendBusinessSms({
  businessId,
  recipient: rider.phone,
  templateKey: "RIDER_DELIVERY_ASSIGNMENT",
  category: "RIDER_NOTIFICATION",
  relatedType: "DELIVERY",
  relatedId: delivery.id,
  variables: {
    orderNumber: order.orderNumber,
    customerName: customer.name,
    customerPhone: customer.phone,
    deliveryAddress: delivery.address,
    deliveryFee: delivery.fee,
  },
});
```

To customer:

```ts
await sendBusinessSms({
  businessId,
  recipient: customer.phone,
  templateKey: "DELIVERY_UPDATE",
  category: "DELIVERY_UPDATE",
  relatedType: "DELIVERY",
  relatedId: delivery.id,
  variables: {
    businessName: business.name,
    customerName: customer.name,
    orderNumber: order.orderNumber,
    deliveryStatus: delivery.status,
    riderName: rider.name,
    riderPhone: rider.phone,
  },
});
```

---

# 17. GENERAL OFFICE UI PAGES

Create General Office SMS management pages.

```txt
src/app/general-office/sms/page.tsx
src/app/general-office/sms/provider/page.tsx
src/app/general-office/sms/packages/page.tsx
src/app/general-office/sms/sender-ids/page.tsx
src/app/general-office/sms/logs/page.tsx
src/app/general-office/sms/wallets/page.tsx
```

## General Office SMS Dashboard

Show:

```txt
Total SMS sent
Failed SMS
Total SMS revenue
Active SMS packages
Pending Sender IDs
Client SMS balances
Provider status
```

## Provider Settings

Fields:

```txt
Provider name
Base URL
API Key
Username
Password
Fallback Sender ID
Active / Inactive
```

## SMS Packages

Actions:

```txt
Create package
Edit package
Disable package
Seed default packages
```

## Sender ID Approvals

Show:

```txt
Business name
Requested Sender ID
Status
Requested date
Approve
Deny
Reason
```

---

# 18. CLIENT SMS UI PAGES

Create client pages.

```txt
src/app/dashboard/settings/sms/page.tsx
src/app/dashboard/settings/sms/sender-id/page.tsx
src/app/dashboard/settings/sms/templates/page.tsx
src/app/dashboard/settings/sms/logs/page.tsx
src/app/dashboard/settings/sms/buy/page.tsx
```

## Client SMS Settings

Show:

```txt
SMS Balance
Sender ID Status
Buy SMS button
SMS automation toggles
SMS logs
```

## Sender ID Setup

Fields:

```txt
Sender ID
Business name
Reason / use case
Submit for approval
```

Status badge:

```txt
Pending
Approved
Denied
```

## Automation Toggles

Client can enable/disable:

```txt
Receipt SMS
Order Confirmation SMS
Payment SMS
Delivery SMS
Rider SMS
Refund SMS
Pay Later Reminder SMS
Low Stock SMS
Daily Sales Summary SMS
```

---

# 19. BUY SMS FLOW

Client flow:

```txt
Client opens Buy SMS page
Selects SMS package
Clicks Pay
Pays using General Office payment gateway
Payment webhook confirms payment
SMS balance increases
SmsPurchase marked PAID
Client receives confirmation SMS/email
```

Payment status:

```txt
PENDING
PAID
FAILED
CANCELLED
```

---

# 20. GENERAL OFFICE PAYMENT GATEWAY

SMS package payments should go to General Office, not the client.

Use:

```txt
General Office Paystack
General Office Hubtel
General Office Flutterwave
```

Recommended for Ghana:

```txt
Hubtel
Paystack
```

The client pays General Office for SMS credits.

---

# 21. API ROUTES

## General Office Routes

```txt
/api/general-office/sms/provider
/api/general-office/sms/packages
/api/general-office/sms/sender-ids
/api/general-office/sms/logs
/api/general-office/sms/wallets
/api/general-office/sms/purchases
```

## Client Routes

```txt
/api/sms/settings
/api/sms/sender-id
/api/sms/templates
/api/sms/logs
/api/sms/packages
/api/sms/purchase
/api/sms/send-test
```

## Webhook Routes

```txt
/api/webhooks/sms-payment
/api/webhooks/splitsms-delivery-report
```

---

# 22. SMS LOG STATUSES

```txt
PENDING
SENT
FAILED
DELIVERED
UNDELIVERED
```

If SplitSMS supports delivery reports, update log status from webhook.

---

# 23. PHONE NUMBER NORMALIZATION

Normalize Ghana phone numbers.

Examples:

```txt
0244123456 -> 233244123456
+233244123456 -> 233244123456
233244123456 -> 233244123456
```

Helper:

```ts
export function normalizeGhanaPhone(phone: string) {
  const cleaned = phone.replace(/\D/g, "");

  if (cleaned.startsWith("0")) {
    return `233${cleaned.slice(1)}`;
  }

  if (cleaned.startsWith("233")) {
    return cleaned;
  }

  return cleaned;
}
```

---

# 24. MORE SMS SOLUTIONS FOR POS

Add these SMS features later.

## Abandoned Cart SMS

For storefront checkout.

```txt
Hi {{customerName}}, you left items in your cart at {{businessName}}. Complete your order here: {{cartLink}}
```

## Birthday SMS

```txt
Happy birthday {{customerName}}! Enjoy a special discount from {{businessName}} today.
```

## Win-back SMS

```txt
Hi {{customerName}}, we miss you at {{businessName}}. New arrivals are available now.
```

## Promo Campaign SMS

Allow clients to send marketing SMS to selected customers.

Filters:

```txt
All customers
VIP customers
Inactive customers
Customers by location
Customers who bought product/category
```

## Customer Debt Reminder

For Pay Later customers.

```txt
Hi {{customerName}}, your pending balance is GHS {{amount}} at {{businessName}}. Kindly pay today.
```

## Appointment Reminder SMS

For beauty/service businesses.

```txt
Reminder: Your appointment with {{businessName}} is on {{date}} at {{time}}.
```

## Stock Arrival SMS

```txt
Good news! {{productName}} is back in stock at {{businessName}}.
```

## Delivery Failed SMS

```txt
Delivery attempt for order {{orderNumber}} failed. Please contact {{businessName}} to reschedule.
```

## Owner Security SMS

```txt
Security alert: New login to {{businessName}} account from {{device}}.
```

## Daily Closing SMS

Send after register close:

```txt
Register closed. Sales: GHS {{sales}}, Cash: GHS {{cash}}, MoMo: GHS {{momo}}, Difference: GHS {{difference}}.
```

---

# 25. SMS TEMPLATE EDITOR

Client should edit templates but not break placeholders.

Features:

```txt
Template preview
Placeholder picker
Character counter
SMS unit counter
Test SMS button
Reset to default
```

Show:

```txt
Characters: 143 / 160
SMS Units: 1
```

---

# 26. SMS BALANCE WARNINGS

Show warning when balance is low.

Rules:

```txt
Balance <= 20 SMS: show warning
Balance = 0: block sending
```

Dashboard banner:

```txt
Your SMS balance is low. Buy SMS to continue sending receipts and delivery updates.
```

---

# 27. NOTIFICATION FALLBACK

If SMS fails:

```txt
Save failed log
Show warning to business admin
Allow retry
Do not block sale completion
```

POS sale should complete even if SMS fails.

---

# 28. SECURITY RULES

```txt
Clients cannot edit provider API keys
Clients cannot approve Sender IDs
Clients cannot increase SMS balance manually
Only General Office can create SMS packages
Only General Office can change SMS pricing
```

---

# 29. PERMISSIONS

Add permissions:

```txt
sms.view
sms.buy
sms.manage_templates
sms.send_manual
sms.view_logs
sms.request_sender_id

general.sms.manage_provider
general.sms.manage_packages
general.sms.approve_sender_id
general.sms.view_all_logs
general.sms.adjust_wallet
```

---

# 30. IMPLEMENTATION ORDER

## Step 1

```txt
Create SMS database models
Run migration
Seed SMS packages
Seed default templates
```

## Step 2

```txt
Build SplitSMS provider service
Build SMS service abstraction
Build template renderer
Build phone normalizer
```

## Step 3

```txt
Build General Office provider settings
Build SMS packages page
Build Sender ID approval page
```

## Step 4

```txt
Build client SMS settings page
Build Sender ID request page
Build template editor
```

## Step 5

```txt
Build SMS wallet and package purchase flow
Connect General Office payment gateway
Handle payment webhook
Credit SMS wallet
```

## Step 6

```txt
Connect receipt SMS to successful POS payment
Connect order confirmation SMS
Connect delivery and rider SMS
```

## Step 7

```txt
Build SMS logs
Build retry failed SMS
Build low balance warnings
```

## Step 8

```txt
Add marketing/manual SMS campaigns later
Add delivery report webhook if SplitSMS supports it
```

---

# 31. MVP SMS SCOPE

Build first:

```txt
General Office SplitSMS config
SMS packages
Client SMS wallet
Sender ID request/approval
Receipt SMS after payment
Delivery SMS
Rider SMS
SMS logs
SMS templates
```

Build later:

```txt
Marketing campaigns
Birthday SMS
Win-back SMS
Bulk SMS
Delivery report webhook
Advanced segmentation
```

---

# 32. FINAL SMS PRODUCT GOAL

The SMS system should make the POS feel professional.

Every important action should notify the right person:

```txt
Customer gets receipt
Customer gets delivery update
Rider gets delivery assignment
Owner gets low stock alert
Admin gets daily sales summary
Client controls templates
General Office controls SMS business
```

This creates another revenue stream for General Office:

```txt
SMS Packages + SaaS Subscription + Payment Processing
```
