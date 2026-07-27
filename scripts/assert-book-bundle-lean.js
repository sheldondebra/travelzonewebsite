/**
 * Guard: tour loaders must stay free of isomorphic-dompurify / jsdom.
 * Pulling that graph into /book crashed the Vercel serverless function.
 */
const fs = require("node:fs");
const path = require("node:path");

const toursPath = path.join(__dirname, "../src/lib/content-public-tours.ts");
const bookPath = path.join(__dirname, "../src/app/book/page.tsx");

const toursSrc = fs.readFileSync(toursPath, "utf8");
const bookSrc = fs.readFileSync(bookPath, "utf8");

const forbidden = ["sanitize-html", "isomorphic-dompurify", "content-public-blog"];

for (const needle of forbidden) {
  if (toursSrc.includes(needle)) {
    console.error(`FAIL: content-public-tours.ts must not reference ${needle}`);
    process.exit(1);
  }
}

if (!bookSrc.includes("content-public-tours")) {
  console.error("FAIL: book/page.tsx must import from content-public-tours");
  process.exit(1);
}

if (bookSrc.includes('from "@/lib/content-public"')) {
  console.error(
    "FAIL: book/page.tsx must not import the content-public barrel (pulls blog/jsdom)",
  );
  process.exit(1);
}

console.log("OK: book/tour loaders stay free of sanitize/jsdom");
