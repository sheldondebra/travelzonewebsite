/**
 * Guard: admin dashboard shell must stay free of isomorphic-dompurify / jsdom.
 * Pulling that graph into the shared admin layout crashed /admin after login.
 */
const fs = require("node:fs");
const path = require("node:path");

const root = path.join(__dirname, "..");
const files = [
  "src/lib/content-admin.ts",
  "src/lib/content-admin-stats.ts",
  "src/app/admin/(dashboard)/layout.tsx",
  "src/app/admin/(dashboard)/page.tsx",
  "src/app/admin/(dashboard)/tours/page.tsx",
];

const forbidden = ["sanitize-html", "isomorphic-dompurify", "content-admin-blog"];

for (const rel of files) {
  const src = fs.readFileSync(path.join(root, rel), "utf8");
  for (const needle of forbidden) {
    if (src.includes(needle)) {
      console.error(`FAIL: ${rel} must not reference ${needle}`);
      process.exit(1);
    }
  }
}

const layoutSrc = fs.readFileSync(
  path.join(root, "src/app/admin/(dashboard)/layout.tsx"),
  "utf8",
);
if (!layoutSrc.includes("content-admin-stats")) {
  console.error("FAIL: admin layout must import getDashboardStats from content-admin-stats");
  process.exit(1);
}
if (layoutSrc.includes('from "@/lib/content-admin"')) {
  console.error("FAIL: admin layout must not import the content-admin barrel (pulls blog/jsdom)");
  process.exit(1);
}

console.log("OK: admin dashboard shell stays free of sanitize/jsdom");
