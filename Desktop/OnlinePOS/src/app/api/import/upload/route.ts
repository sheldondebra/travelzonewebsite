import { getTableRows } from "@/server/services/import/import-helpers";
import {
  countGarbageProductNames,
  looksLikeSqlDump,
} from "@/lib/import/detect-garbage";
import { parseMysqlDump, buildTableSummary } from "@/lib/import/mysql-dump-parser";
import { prisma } from "@/lib/prisma";
import { apiSuccess, handleApiError } from "@/server/utils/api-response";
import { withBusinessAuth } from "@/server/utils/with-auth";
import { AppError } from "@/server/utils/errors";

const MAX_BYTES = 15 * 1024 * 1024;

export async function POST(request: Request) {
  return withBusinessAuth(request, async (businessId) => {
    try {
      const form = await request.formData();
      const file = form.get("file");
      if (!file || !(file instanceof File)) {
        throw new AppError("Please upload a .sql file", 400);
      }

      if (file.size > MAX_BYTES) {
        throw new AppError("File is too large. Maximum size is 15MB.", 400);
      }

      const fileName = file.name.toLowerCase();
      if (!fileName.endsWith(".sql") && !fileName.endsWith(".zip")) {
        throw new AppError("Please upload a valid .sql file", 400);
      }

      if (fileName.endsWith(".zip")) {
        throw new AppError(
          "ZIP uploads are not supported yet. Please extract the .sql file first.",
          400,
        );
      }

      const sqlContent = await file.text();
      if (!sqlContent.trim()) {
        throw new AppError("The SQL file could not be read. Please upload a valid phpMyAdmin export.", 400);
      }

      if (!looksLikeSqlDump(sqlContent)) {
        throw new AppError(
          "This file does not look like a phpMyAdmin MySQL dump. Export from the legacy system as .sql or use the bundled Novasori import.",
          400,
        );
      }

      const parsed = parseMysqlDump(sqlContent);
      const tableSummary = buildTableSummary(parsed);

      const productRows = getTableRows(parsed.inserts.products);
      if (productRows.length === 0) {
        throw new AppError(
          'No product rows found. Ensure the dump includes INSERT INTO `products` with column names.',
          400,
        );
      }
      const garbage = countGarbageProductNames(
        productRows.map((r) => String(r.name ?? "")),
      );
      if (garbage > productRows.length * 0.1) {
        throw new AppError(
          "Product rows in this dump could not be parsed correctly. Re-export from phpMyAdmin or use import-data/novasori_novaosp.sql.",
          400,
        );
      }

      const session = await prisma.importSession.create({
        data: {
          businessId,
          fileName: file.name,
          fileSize: file.size,
          sqlContent,
          status: "ANALYZED",
          tableSummary,
        },
      });

      return apiSuccess(
        {
          sessionId: session.id,
          fileName: session.fileName,
          fileSize: session.fileSize,
          tableCount: parsed.tables.length,
          tableSummary,
        },
        "SQL dump uploaded and analyzed",
        201,
      );
    } catch (error) {
      return handleApiError(error);
    }
  });
}
