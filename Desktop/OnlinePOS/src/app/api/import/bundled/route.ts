import { existsSync, readFileSync, statSync } from "fs";
import { join } from "path";
import { buildTableSummary, parseMysqlDump } from "@/lib/import/mysql-dump-parser";
import { prisma } from "@/lib/prisma";
import {
  DEFAULT_IMPORT_RUN_OPTIONS,
  runDatabaseImport,
} from "@/server/services/import/run-import";
import { apiSuccess, handleApiError } from "@/server/utils/api-response";
import { AppError } from "@/server/utils/errors";
import { withBusinessAuth } from "@/server/utils/with-auth";

function resolveBundledSql(): string {
  const candidates = [
    join(process.cwd(), "novasori_novaosp.sql"),
    join(process.cwd(), "import-data", "novasori_novaosp.sql"),
  ];
  for (const p of candidates) {
    if (existsSync(p)) return p;
  }
  return candidates[0]!;
}

export async function POST(request: Request) {
  return withBusinessAuth(request, async (businessId) => {
    try {
      const bundledPath = resolveBundledSql();
      if (!existsSync(bundledPath)) {
        throw new AppError(
          "Bundled SQL file not found. Place novasori_novaosp.sql in the project root or import-data/",
          404,
        );
      }

      const sqlContent = readFileSync(bundledPath, "utf8");
      const parsed = parseMysqlDump(sqlContent);
      const tableSummary = buildTableSummary(parsed);

      const session = await prisma.importSession.create({
        data: {
          businessId,
          fileName: "novasori_novaosp.sql",
          fileSize: statSync(bundledPath).size,
          sqlContent,
          status: "ANALYZED",
          tableSummary,
        },
      });

      const result = await runDatabaseImport(
        businessId,
        session.id,
        {
          ...DEFAULT_IMPORT_RUN_OPTIONS,
          mode: "full",
          updateExisting: true,
          skipDuplicates: false,
        },
      );

      return apiSuccess(
        { sessionId: session.id, tableSummary, result },
        "Bundled database import completed",
      );
    } catch (error) {
      return handleApiError(error);
    }
  });
}
