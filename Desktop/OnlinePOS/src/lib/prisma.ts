import "@/lib/bigint-json";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import { PrismaClient } from "@/generated/prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function createPrismaClient() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const adapter = new PrismaPg(pool);
  return new PrismaClient({ adapter });
}

/** Dev HMR can keep an old PrismaClient missing newer models (e.g. registerSession). */
function isClientUpToDate(client: PrismaClient) {
  return (
    typeof (client as PrismaClient & { registerSession?: { findFirst?: unknown } })
      .registerSession?.findFirst === "function" &&
    typeof (client as PrismaClient & { billingPlan?: { findFirst?: unknown } })
      .billingPlan?.findFirst === "function"
  );
}

function getPrismaClient() {
  const cached = globalForPrisma.prisma;
  if (cached && isClientUpToDate(cached)) {
    return cached;
  }
  const client = createPrismaClient();
  if (process.env.NODE_ENV !== "production") {
    globalForPrisma.prisma = client;
  }
  return client;
}

export const prisma = getPrismaClient();
