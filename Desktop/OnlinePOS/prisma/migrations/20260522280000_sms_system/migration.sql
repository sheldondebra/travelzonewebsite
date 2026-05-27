-- SMS system: SplitSMS, wallets, packages, sender IDs, logs

CREATE TABLE "SmsProviderConfig" (
    "id" TEXT NOT NULL,
    "provider" TEXT NOT NULL DEFAULT 'SPLITSMS',
    "baseUrl" TEXT NOT NULL,
    "apiKey" TEXT NOT NULL,
    "username" TEXT,
    "password" TEXT,
    "senderId" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SmsProviderConfig_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "BusinessSenderId" (
    "id" TEXT NOT NULL,
    "businessId" TEXT NOT NULL,
    "senderId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "reason" TEXT,
    "requestedBy" TEXT,
    "reviewedBy" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BusinessSenderId_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "SmsPackage" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "smsCount" INTEGER NOT NULL,
    "price" DOUBLE PRECISION NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'GHS',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SmsPackage_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "BusinessSmsWallet" (
    "id" TEXT NOT NULL,
    "businessId" TEXT NOT NULL,
    "balance" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BusinessSmsWallet_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "SmsPurchase" (
    "id" TEXT NOT NULL,
    "businessId" TEXT NOT NULL,
    "packageId" TEXT NOT NULL,
    "smsCount" INTEGER NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'GHS',
    "paymentStatus" TEXT NOT NULL DEFAULT 'PENDING',
    "paymentMethod" TEXT,
    "paymentReference" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SmsPurchase_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "SmsTemplate" (
    "id" TEXT NOT NULL,
    "businessId" TEXT,
    "key" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SmsTemplate_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "SmsLog" (
    "id" TEXT NOT NULL,
    "businessId" TEXT,
    "recipient" TEXT NOT NULL,
    "senderId" TEXT,
    "message" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "provider" TEXT NOT NULL DEFAULT 'SPLITSMS',
    "providerMessageId" TEXT,
    "providerResponse" JSONB,
    "errorMessage" TEXT,
    "smsUnits" INTEGER NOT NULL DEFAULT 1,
    "cost" DOUBLE PRECISION,
    "relatedType" TEXT,
    "relatedId" TEXT,
    "sentAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SmsLog_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "SmsAutomationSetting" (
    "id" TEXT NOT NULL,
    "businessId" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SmsAutomationSetting_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "BusinessSmsWallet_businessId_key" ON "BusinessSmsWallet"("businessId");
CREATE INDEX "BusinessSenderId_businessId_idx" ON "BusinessSenderId"("businessId");
CREATE INDEX "BusinessSenderId_status_idx" ON "BusinessSenderId"("status");
CREATE INDEX "SmsPurchase_businessId_idx" ON "SmsPurchase"("businessId");
CREATE INDEX "SmsPurchase_paymentStatus_idx" ON "SmsPurchase"("paymentStatus");
CREATE INDEX "SmsTemplate_businessId_idx" ON "SmsTemplate"("businessId");
CREATE INDEX "SmsTemplate_key_idx" ON "SmsTemplate"("key");
CREATE INDEX "SmsLog_businessId_idx" ON "SmsLog"("businessId");
CREATE INDEX "SmsLog_status_idx" ON "SmsLog"("status");
CREATE INDEX "SmsLog_category_idx" ON "SmsLog"("category");
CREATE INDEX "SmsLog_recipient_idx" ON "SmsLog"("recipient");
CREATE UNIQUE INDEX "SmsAutomationSetting_businessId_key_key" ON "SmsAutomationSetting"("businessId", "key");

ALTER TABLE "BusinessSenderId" ADD CONSTRAINT "BusinessSenderId_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "BusinessSmsWallet" ADD CONSTRAINT "BusinessSmsWallet_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "SmsPurchase" ADD CONSTRAINT "SmsPurchase_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "SmsPurchase" ADD CONSTRAINT "SmsPurchase_packageId_fkey" FOREIGN KEY ("packageId") REFERENCES "SmsPackage"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "SmsTemplate" ADD CONSTRAINT "SmsTemplate_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "SmsLog" ADD CONSTRAINT "SmsLog_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "SmsAutomationSetting" ADD CONSTRAINT "SmsAutomationSetting_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE CASCADE ON UPDATE CASCADE;
