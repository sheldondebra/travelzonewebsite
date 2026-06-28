import { spawnSync } from "child_process";
import { getDatabaseUrl } from "./db-url";
import { loadLocalEnv } from "./load-env";

loadLocalEnv();

function run(script: string) {
  const result = spawnSync("npm", ["run", script], {
    stdio: "inherit",
    shell: true,
    cwd: process.cwd(),
  });
  if (result.status !== 0) process.exit(result.status ?? 1);
}

async function bootstrap() {
  if (getDatabaseUrl()) {
    console.log("Setting up database tables…");
    run("db:setup");
  } else {
    console.log(
      "No DATABASE_URL / SUPABASE_DB_PASSWORD — skipping table setup.\n" +
        "If tables are missing, run supabase/setup-all.sql in the SQL Editor first.\n",
    );
  }

  console.log("Seeding tours and blog posts…");
  run("seed");
  console.log("Bootstrap complete.");
}

bootstrap().catch((error) => {
  console.error(error);
  process.exit(1);
});
