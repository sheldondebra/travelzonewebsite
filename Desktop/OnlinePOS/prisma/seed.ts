import "dotenv/config";
import { hashPassword } from "../src/lib/auth/password";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import { PrismaClient } from "../src/generated/prisma/client";
import {
  seedDefaultSmsPackages,
  seedDefaultSmsTemplates,
} from "../src/server/services/sms/sms-service";

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter: new PrismaPg(pool) });

const ADMIN_EMAIL =
  process.env.PLATFORM_ADMIN_EMAIL ?? "support@tecunitgh.com";
const ADMIN_PASSWORD = process.env.PLATFORM_ADMIN_PASSWORD;
const ADMIN_NAME = process.env.PLATFORM_ADMIN_NAME ?? "General Office";
const OFFICE_NAME = process.env.PLATFORM_OFFICE_NAME ?? "Tecunit General Office";
const OFFICE_SLUG = "tecunit-general-office";

async function main() {
  if (!ADMIN_PASSWORD) {
    throw new Error(
      "Set PLATFORM_ADMIN_PASSWORD in .env before running the seed.",
    );
  }

  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL is required.");
  }

  const hashed = await hashPassword(ADMIN_PASSWORD);

  const platformOfficeFromEnv = {
    inheritToAllTenants: true,
    autoEnableTenantSms: true,
    autoEnableTenantEmail: true,
    autoEnablePosReceiptDelivery: true,
    sms: {
      enabled: Boolean(process.env.HUBTEL_CLIENT_ID),
      provider: "hubtel",
      apiKey: process.env.HUBTEL_SMS_API_KEY ?? "",
      senderId: process.env.HUBTEL_SENDER_ID ?? "",
      hubtelClientId: process.env.HUBTEL_CLIENT_ID ?? "",
      hubtelClientSecret: process.env.HUBTEL_CLIENT_SECRET ?? "",
    },
    mail: {
      enabled: Boolean(process.env.RESEND_API_KEY || process.env.SMTP_HOST),
      fromName: OFFICE_NAME,
      fromEmail: process.env.RESEND_FROM_EMAIL ?? "",
      smtpHost: process.env.SMTP_HOST ?? "",
      smtpPort: Number(process.env.SMTP_PORT ?? 587),
      smtpUser: process.env.SMTP_USER ?? "",
      smtpPass: process.env.SMTP_PASS ?? "",
      resendApiKey: process.env.RESEND_API_KEY ?? "",
    },
  };

  const office = await prisma.business.upsert({
    where: { slug: OFFICE_SLUG },
    create: {
      name: OFFICE_NAME,
      slug: OFFICE_SLUG,
      description: "Tecunit platform operations and support",
      isPublic: false,
      isVerified: true,
      badges: ["Platform"],
      subscriptionPlan: "ENTERPRISE",
      settings: { platformOffice: platformOfficeFromEnv },
    },
    update: {
      name: OFFICE_NAME,
      isVerified: true,
      badges: ["Platform"],
      subscriptionPlan: "ENTERPRISE",
      settings: { platformOffice: platformOfficeFromEnv },
    },
  });

  const user = await prisma.user.upsert({
    where: { email: ADMIN_EMAIL },
    create: {
      email: ADMIN_EMAIL,
      password: hashed,
      name: ADMIN_NAME,
      role: "PLATFORM_ADMIN",
      businessId: office.id,
    },
    update: {
      password: hashed,
      name: ADMIN_NAME,
      role: "PLATFORM_ADMIN",
      businessId: office.id,
    },
  });

  console.log("Platform admin seeded:");
  console.log(`  Email:    ${user.email}`);
  console.log(`  Name:     ${user.name}`);
  console.log(`  Role:     ${user.role}`);
  console.log(`  Office:   ${office.name} (${office.slug})`);
  console.log(`  Login at: ${process.env.NEXTAUTH_URL ?? "http://localhost:3000"}/login`);

  const smsPackages = await seedDefaultSmsPackages();
  await seedDefaultSmsTemplates();
  console.log("SMS defaults seeded:", smsPackages);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
