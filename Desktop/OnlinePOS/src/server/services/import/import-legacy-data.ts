import type { PaymentMethod, Prisma } from "@/generated/prisma/client";
import type { ParsedMysqlDump } from "@/lib/import/mysql-dump-parser";
import { resolveLegacyImportImage } from "@/lib/import/legacy-image";
import { toBigInt, toNumber } from "@/lib/import/mysql-values";
import { prisma } from "@/lib/prisma";
import { calculateOrderTotals } from "@/server/services/order/calculate-profit";
import { getOrCreateWalkInCustomer } from "@/server/services/customer/walk-in-customer";
import type { ImportRunOptions } from "@/server/services/import/run-import";
import type { ImportIdMaps } from "@/server/services/import/id-maps";
import {
  filterActiveRows,
  getTableRows,
  logMigration,
  oldIdKey,
} from "@/server/services/import/import-helpers";
import {
  mapLegacyDeliveryStatus,
  mapLegacyPaymentMethodName,
  mapLegacyPaymentStatus,
  parseLegacyDateTime,
} from "@/server/services/import/legacy-mappers";

type TrackFn = (
  table: string,
  status: "success" | "failed" | "skipped" | "warning",
) => void;
type OnErrorFn = (
  table: string,
  oldId: bigint | null,
  message: string,
  source?: unknown,
) => Promise<void>;

export async function importLegacyBusinessSettings(
  businessId: string,
  sessionId: string,
  parsed: ParsedMysqlDump,
  track: TrackFn,
  onError: OnErrorFn,
) {
  const settingsRows = filterActiveRows(getTableRows(parsed.inserts.settings));
  const currencyRows = filterActiveRows(getTableRows(parsed.inserts.currencies));
  const posRows = filterActiveRows(getTableRows(parsed.inserts.pos_settings));
  const paymentRows = filterActiveRows(
    getTableRows(parsed.inserts.payment_methods),
  );

  if (
    settingsRows.length === 0 &&
    currencyRows.length === 0 &&
    paymentRows.length === 0
  ) {
    return;
  }

  try {
    const settings = settingsRows[0];
    const currencyId = settings ? toBigInt(settings.currency_id) : null;
    const currency = currencyId
      ? currencyRows.find((c) => toBigInt(c.id) === currencyId)
      : currencyRows[0];

    const business = await prisma.business.findUnique({
      where: { id: businessId },
      select: { settings: true, name: true },
    });
    if (!business) return;

    const legacySettings = {
      ...(typeof business.settings === "object" && business.settings
        ? (business.settings as Record<string, unknown>)
        : {}),
      legacy: {
        settings: settings ?? null,
        pos_settings: posRows[0] ?? null,
        currencies: currencyRows,
        paymentMethods: paymentRows.map((p) => ({
          oldId: oldIdKey(p),
          name: String(p.name ?? ""),
        })),
        importedAt: new Date().toISOString(),
      },
    };

    const paymentMethodMap: Record<string, PaymentMethod> = {};
    for (const p of paymentRows) {
      const id = oldIdKey(p);
      if (!id) continue;
      paymentMethodMap[String(id)] = mapLegacyPaymentMethodName(
        String(p.name ?? "Cash"),
      );
    }

    await prisma.business.update({
      where: { id: businessId },
      data: {
        name: settings?.CompanyName
          ? String(settings.CompanyName)
          : business.name,
        currency: currency?.symbol
          ? String(currency.symbol)
          : currency?.code
            ? String(currency.code)
            : undefined,
        taxRate: settings?.default_tax != null ? toNumber(settings.default_tax) : undefined,
        receiptFooter: settings?.invoice_footer
          ? String(settings.invoice_footer)
          : settings?.footer
            ? String(settings.footer)
            : undefined,
        logoUrl: settings?.logo
          ? resolveLegacyImportImage(settings.logo)
          : undefined,
        settings: {
          ...legacySettings,
          legacyPaymentMethodMap: paymentMethodMap,
        } as Prisma.InputJsonValue,
      },
    });

    await logMigration({
      businessId,
      importSessionId: sessionId,
      tableName: "settings",
      status: "SUCCESS",
      message: "Merged legacy settings into business profile",
    });
    track("settings", "success");
  } catch (e) {
    await onError(
      "settings",
      null,
      e instanceof Error ? e.message : "Failed to import settings",
    );
  }
}

export async function importLegacyClients(
  businessId: string,
  sessionId: string,
  parsed: ParsedMysqlDump,
  maps: ImportIdMaps,
  options: ImportRunOptions,
  track: TrackFn,
  onError: OnErrorFn,
) {
  const rows = filterActiveRows(getTableRows(parsed.inserts.clients));
  for (const row of rows) {
    const oldId = oldIdKey(row);
    if (!oldId) continue;
    try {
      const name = String(row.name ?? "").trim();
      if (!name) throw new Error("Client name is required");

      const phone = row.phone != null ? String(row.phone) : null;
      const email = row.email ? String(row.email) : null;
      const notes = row.adresse ? String(row.adresse) : null;
      const balance = toNumber(row.opening_balance);
      const legacyCode = row.code != null ? String(row.code) : null;

      const existing = await prisma.customer.findFirst({
        where: { businessId, oldId },
      });

      let record;
      let skipped = false;
      if (existing) {
        if (options.updateExisting) {
          record = await prisma.customer.update({
            where: { id: existing.id },
            data: { name, phone, email, notes, balance, legacyCode, oldId },
          });
          skipped = false;
        } else if (options.skipDuplicates) {
          record = existing;
          skipped = true;
        } else {
          record = existing;
          skipped = true;
        }
      } else {
        record = await prisma.customer.create({
          data: {
            businessId,
            oldId,
            legacyCode,
            name,
            phone,
            email,
            notes,
            balance,
            tags: ["legacy-import"],
          },
        });
      }

      maps.set("clients", oldId, record.id);
      await logMigration({
        businessId,
        importSessionId: sessionId,
        tableName: "clients",
        oldId,
        newId: record.id,
        status: skipped ? "SKIPPED" : "SUCCESS",
      });
      track("clients", skipped ? "skipped" : "success");
    } catch (e) {
      await onError("clients", oldId, e instanceof Error ? e.message : "Failed", row);
    }
  }
}

export async function importLegacyUsers(
  businessId: string,
  sessionId: string,
  parsed: ParsedMysqlDump,
  maps: ImportIdMaps,
  options: ImportRunOptions,
  track: TrackFn,
  onError: OnErrorFn,
) {
  const rows = filterActiveRows(getTableRows(parsed.inserts.users));
  for (const row of rows) {
    const oldId = oldIdKey(row);
    if (!oldId) continue;
    try {
      const existing = await prisma.legacyUser.findFirst({
        where: { businessId, oldId },
      });

      const data = {
        businessId,
        oldId,
        firstName: String(row.firstname ?? "").trim() || "Legacy",
        lastName: String(row.lastname ?? "").trim() || "User",
        username: String(row.username ?? `user-${oldId}`),
        email: String(row.email ?? `legacy-${oldId}@import.local`),
        phone: row.phone != null ? String(row.phone) : null,
        roleId: row.role_id != null ? Number(row.role_id) : null,
        isActive: row.statut != null ? Boolean(Number(row.statut)) : true,
        legacyMeta: row as Prisma.InputJsonObject,
      };

      let record;
      let skipped = false;
      if (existing) {
        if (options.updateExisting) {
          record = await prisma.legacyUser.update({
            where: { id: existing.id },
            data,
          });
        } else if (options.skipDuplicates) {
          record = existing;
          skipped = true;
        } else {
          record = existing;
          skipped = true;
        }
      } else {
        record = await prisma.legacyUser.create({ data });
      }

      maps.set("users", oldId, record.id);
      await logMigration({
        businessId,
        importSessionId: sessionId,
        tableName: "users",
        oldId,
        newId: record.id,
        status: skipped ? "SKIPPED" : "SUCCESS",
      });
      track("users", skipped ? "skipped" : "success");
    } catch (e) {
      await onError("users", oldId, e instanceof Error ? e.message : "Failed", row);
    }
  }
}

export async function importLegacyCashRegisters(
  businessId: string,
  sessionId: string,
  parsed: ParsedMysqlDump,
  maps: ImportIdMaps,
  options: ImportRunOptions,
  track: TrackFn,
  onError: OnErrorFn,
) {
  const rows = filterActiveRows(getTableRows(parsed.inserts.cash_registers));
  for (const row of rows) {
    const oldId = oldIdKey(row);
    if (!oldId) continue;
    try {
      const warehouseId = maps.get("warehouses", toBigInt(row.warehouse_id));
      const openedAt =
        parseLegacyDateTime(row.opened_at) ??
        new Date(String(row.created_at ?? Date.now()));
      const closedAt = parseLegacyDateTime(row.closed_at);

      const data = {
        businessId,
        oldId,
        warehouseId: warehouseId ?? undefined,
        legacyUserOldId: toBigInt(row.user_id) ?? undefined,
        openingBalance: toNumber(row.opening_balance),
        closingBalance:
          row.closing_balance != null ? toNumber(row.closing_balance) : null,
        totalSales: toNumber(row.total_sales),
        cashIn: toNumber(row.cash_in),
        cashOut: toNumber(row.cash_out),
        difference: row.difference != null ? toNumber(row.difference) : null,
        status: String(row.status ?? "open"),
        openedAt,
        closedAt: closedAt ?? undefined,
        notes: row.notes ? String(row.notes) : null,
        legacyMeta: row as Prisma.InputJsonObject,
      };

      const existing = await prisma.cashRegister.findFirst({
        where: { businessId, oldId },
      });

      let record;
      let skipped = false;
      if (existing) {
        if (options.updateExisting) {
          record = await prisma.cashRegister.update({
            where: { id: existing.id },
            data,
          });
        } else if (options.skipDuplicates) {
          record = existing;
          skipped = true;
        } else {
          record = existing;
          skipped = true;
        }
      } else {
        record = await prisma.cashRegister.create({ data });
      }

      maps.set("cash_registers", oldId, record.id);
      await logMigration({
        businessId,
        importSessionId: sessionId,
        tableName: "cash_registers",
        oldId,
        newId: record.id,
        status: skipped ? "SKIPPED" : "SUCCESS",
      });
      track("cash_registers", skipped ? "skipped" : "success");
    } catch (e) {
      await onError(
        "cash_registers",
        oldId,
        e instanceof Error ? e.message : "Failed",
        row,
      );
    }
  }
}

export async function importLegacySales(
  businessId: string,
  sessionId: string,
  parsed: ParsedMysqlDump,
  maps: ImportIdMaps,
  options: ImportRunOptions,
  track: TrackFn,
  onError: OnErrorFn,
) {
  const business = await prisma.business.findUnique({
    where: { id: businessId },
    select: { settings: true },
  });
  const paymentMap =
    business?.settings &&
    typeof business.settings === "object" &&
    business.settings !== null &&
    "legacyPaymentMethodMap" in business.settings
      ? (business.settings as { legacyPaymentMethodMap?: Record<string, PaymentMethod> })
          .legacyPaymentMethodMap ?? {}
      : {};

  const walkIn = await getOrCreateWalkInCustomer(businessId);
  const detailRows = filterActiveRows(getTableRows(parsed.inserts.sale_details));
  const detailsBySale = new Map<string, Record<string, unknown>[]>();
  for (const d of detailRows) {
    const sid = String(d.sale_id ?? "");
    if (!sid) continue;
    const list = detailsBySale.get(sid) ?? [];
    list.push(d);
    detailsBySale.set(sid, list);
  }

  const paymentRows = filterActiveRows(getTableRows(parsed.inserts.payment_sales));
  const paymentsBySale = new Map<string, Record<string, unknown>[]>();
  for (const p of paymentRows) {
    const sid = String(p.sale_id ?? "");
    if (!sid) continue;
    const list = paymentsBySale.get(sid) ?? [];
    list.push(p);
    paymentsBySale.set(sid, list);
  }

  const sales = filterActiveRows(getTableRows(parsed.inserts.sales));

  const productCostByOld = new Map<string, number>();
  for (const p of getTableRows(parsed.inserts.products)) {
    const id = oldIdKey(p);
    if (id) productCostByOld.set(String(id), toNumber(p.cost));
  }
  const variantCostByOld = new Map<string, number>();
  for (const v of getTableRows(parsed.inserts.product_variants)) {
    const id = oldIdKey(v);
    if (id) variantCostByOld.set(String(id), toNumber(v.cost));
  }
  for (const row of sales) {
    const oldId = oldIdKey(row);
    if (!oldId) continue;
    try {
      const existing = await prisma.order.findFirst({
        where: { businessId, oldId },
      });
      if (existing && !options.updateExisting && options.skipDuplicates) {
        maps.set("sales", oldId, existing.id);
        track("sales", "skipped");
        continue;
      }

      const clientOld = toBigInt(row.client_id);
      const customerId =
        (clientOld ? maps.get("clients", clientOld) : null) ?? walkIn.id;

      const lineRows = detailsBySale.get(String(oldId)) ?? [];

      const lines: {
        productId: string;
        variantId: string | null;
        quantity: number;
        price: number;
        lineTotal: number;
        costPrice: number;
        lineLabel: string | null;
        detailOldId: bigint | null;
      }[] = [];

      for (const line of lineRows) {
        const detailOldId = oldIdKey(line);
        const productId = maps.get("products", toBigInt(line.product_id));
        if (!productId) {
          await logMigration({
            businessId,
            importSessionId: sessionId,
            tableName: "sale_details",
            oldId: detailOldId,
            status: "WARNING",
            message: `Sale ${oldId}: product ${line.product_id} not in catalog — line skipped`,
            sourceData: line,
          });
          track("sale_details", "warning");
          continue;
        }

        const variantOldId = toBigInt(line.product_variant_id);
        const variantId =
          variantOldId && Number(variantOldId) !== 0
            ? maps.get("variants", variantOldId) ?? null
            : null;

        const product = await prisma.product.findUnique({
          where: { id: productId },
          select: { name: true, costPrice: true },
        });
        const variant = variantId
          ? await prisma.productVariant.findUnique({
              where: { id: variantId },
              select: { name: true, costPrice: true },
            })
          : null;

        const qty = Math.max(1, Math.round(toNumber(line.quantity, 1)));
        const lineTotal = toNumber(line.total);
        const unitPrice =
          qty > 0 ? lineTotal / qty : toNumber(line.price);
        const productOld = String(line.product_id ?? "");
        const variantOldKey =
          variantOldId && Number(variantOldId) !== 0
            ? String(variantOldId)
            : null;
        let unitCost = 0;
        if (variantOldKey && variantCostByOld.has(variantOldKey)) {
          unitCost = variantCostByOld.get(variantOldKey)!;
        } else if (productCostByOld.has(productOld)) {
          unitCost = productCostByOld.get(productOld)!;
        } else {
          unitCost = variant?.costPrice ?? product?.costPrice ?? 0;
        }
        const costPrice = unitCost;
        const lineLabel = variant
          ? `${product?.name ?? "Product"} — ${variant.name}`
          : product?.name ?? null;

        lines.push({
          productId,
          variantId,
          quantity: qty,
          price: unitPrice,
          lineTotal,
          costPrice,
          lineLabel,
          detailOldId,
        });
      }

      if (lines.length === 0) {
        await logMigration({
          businessId,
          importSessionId: sessionId,
          tableName: "sales",
          oldId,
          status: "WARNING",
          message: "Sale skipped — no resolvable line items",
          sourceData: row,
        });
        track("sales", "warning");
        continue;
      }

      const { profit } = calculateOrderTotals(
        lines.map((l) => ({
          productId: l.productId,
          variantId: l.variantId,
          quantity: l.quantity,
          price: l.price,
          costPrice: l.costPrice,
          lineLabel: l.lineLabel,
        })),
      );
      const grandTotal = toNumber(row.GrandTotal);
      const paidAmount = toNumber(row.paid_amount);

      const payList = paymentsBySale.get(String(oldId)) ?? [];
      const paymentTotal = payList.reduce(
        (sum, p) => sum + toNumber(p.montant),
        0,
      );
      const firstPay = payList[0];
      const payMethodOld = firstPay ? toBigInt(firstPay.payment_method_id) : null;
      const paymentMethod =
        payMethodOld && paymentMap[String(payMethodOld)]
          ? paymentMap[String(payMethodOld)]
          : firstPay
            ? mapLegacyPaymentMethodName("Cash")
            : null;

      const warehouseOld = toBigInt(row.warehouse_id);
      const warehouseId = warehouseOld
        ? maps.get("warehouses", warehouseOld)
        : undefined;

      const createdAt =
        parseLegacyDateTime(row.date, row.time) ??
        new Date(String(row.created_at ?? Date.now()));

      const orderData = {
        businessId,
        oldId,
        reference: row.Ref ? String(row.Ref) : null,
        customerId,
        totalAmount: grandTotal,
        profit,
        amountPaid: paidAmount,
        paymentStatus: mapLegacyPaymentStatus(row.payment_statut),
        deliveryStatus: mapLegacyDeliveryStatus(row.statut, row.shipping_status),
        paymentMethod,
        notes: row.notes ? String(row.notes) : null,
        legacyMeta: {
          sale_uuid: row.sale_uuid != null ? String(row.sale_uuid) : null,
          is_pos: row.is_pos != null ? Boolean(row.is_pos) : null,
          tax_rate: row.tax_rate != null ? toNumber(row.tax_rate) : null,
          TaxNet: row.TaxNet != null ? toNumber(row.TaxNet) : null,
          discount: row.discount != null ? toNumber(row.discount) : null,
          warehouseOldId: warehouseOld != null ? String(warehouseOld) : null,
          warehouseId: warehouseId ?? null,
          userOldId: row.user_id != null ? String(row.user_id) : null,
          payment_sales_total: paymentTotal,
          payment_sales: payList.map((p) => ({
            oldId: oldIdKey(p) != null ? String(oldIdKey(p)) : null,
            montant: toNumber(p.montant),
            ref: p.Ref != null ? String(p.Ref) : null,
            payment_method_id:
              p.payment_method_id != null ? String(p.payment_method_id) : null,
            date: p.date != null ? String(p.date) : null,
          })),
          line_totals: lines.map((l) => ({
            detailOldId: l.detailOldId != null ? String(l.detailOldId) : null,
            lineTotal: l.lineTotal,
            quantity: l.quantity,
          })),
        } satisfies Prisma.InputJsonObject,
        createdAt,
        updatedAt: createdAt,
        items: {
          create: lines.map((l) => ({
            productId: l.productId,
            variantId: l.variantId,
            quantity: l.quantity,
            price: l.price,
            lineTotal: l.lineTotal,
            unitCost: l.costPrice,
            lineLabel: l.lineLabel,
          })),
        },
      };

      const order = existing
        ? await prisma.order.update({
            where: { id: existing.id },
            data: {
              ...orderData,
              items: undefined,
            },
          })
        : await prisma.order.create({ data: orderData });

      if (existing && options.updateExisting) {
        await prisma.orderItem.deleteMany({ where: { orderId: order.id } });
        await prisma.orderItem.createMany({
          data: lines.map((l) => ({
            orderId: order.id,
            productId: l.productId,
            variantId: l.variantId,
            quantity: l.quantity,
            price: l.price,
            lineTotal: l.lineTotal,
            unitCost: l.costPrice,
            lineLabel: l.lineLabel,
          })),
        });
      }

      maps.set("sales", oldId, order.id);
      await logMigration({
        businessId,
        importSessionId: sessionId,
        tableName: "sales",
        oldId,
        newId: order.id,
        status: "SUCCESS",
      });
      track("sales", "success");
    } catch (e) {
      await onError("sales", oldId, e instanceof Error ? e.message : "Failed", row);
    }
  }
}

export async function importLegacySaleReturns(
  businessId: string,
  sessionId: string,
  parsed: ParsedMysqlDump,
  maps: ImportIdMaps,
  options: ImportRunOptions,
  track: TrackFn,
  onError: OnErrorFn,
) {
  const walkIn = await getOrCreateWalkInCustomer(businessId);
  const detailRows = filterActiveRows(
    getTableRows(parsed.inserts.sale_return_details),
  );
  const detailsByReturn = new Map<string, Record<string, unknown>[]>();
  for (const d of detailRows) {
    const rid = String(d.sale_return_id ?? "");
    if (!rid) continue;
    const list = detailsByReturn.get(rid) ?? [];
    list.push(d);
    detailsByReturn.set(rid, list);
  }

  // Include soft-deleted returns for historical accuracy
  const rows = getTableRows(parsed.inserts.sale_returns);
  for (const row of rows) {
    const oldId = oldIdKey(row);
    if (!oldId) continue;
    try {
      const existing = await prisma.saleReturn.findFirst({
        where: { businessId, oldId },
      });
      if (existing && !options.updateExisting && options.skipDuplicates) {
        maps.set("sale_returns", oldId, existing.id);
        track("sale_returns", "skipped");
        continue;
      }

      const clientOld = toBigInt(row.client_id);
      const customerId =
        (clientOld ? maps.get("clients", clientOld) : null) ?? walkIn.id;

      const saleOld = toBigInt(row.sale_id);
      const orderId = saleOld ? maps.get("sales", saleOld) : undefined;

      const lineRows = detailsByReturn.get(String(oldId)) ?? [];
      const lineCreates: {
        productId?: string;
        variantId?: string;
        quantity: number;
        unitPrice: number;
        lineTotal: number;
        lineLabel?: string;
        legacyDetailOldId?: bigint;
      }[] = [];

      for (const line of lineRows) {
        const detailOldId = oldIdKey(line);
        const productId = maps.get("products", toBigInt(line.product_id));
        if (!productId) {
          await logMigration({
            businessId,
            importSessionId: sessionId,
            tableName: "sale_return_details",
            oldId: detailOldId,
            status: "WARNING",
            message: `Return ${oldId}: product ${line.product_id} missing — line skipped`,
            sourceData: line,
          });
          track("sale_return_details", "warning");
          continue;
        }

        const variantOld = toBigInt(line.product_variant_id);
        const variantId =
          variantOld && Number(variantOld) !== 0
            ? maps.get("variants", variantOld) ?? null
            : null;

        const qty = Math.max(1, Math.round(toNumber(line.quantity, 1)));
        const lineTotal = toNumber(line.total);
        const unitPrice =
          qty > 0 ? lineTotal / qty : toNumber(line.price);

        lineCreates.push({
          productId,
          variantId: variantId ?? undefined,
          quantity: qty,
          unitPrice,
          lineTotal,
          legacyDetailOldId: detailOldId ?? undefined,
        });
      }

      const createdAt =
        parseLegacyDateTime(row.date, row.time) ??
        new Date(String(row.created_at ?? Date.now()));

      const data = {
        businessId,
        oldId,
        orderId,
        customerId,
        reference: row.Ref ? String(row.Ref) : null,
        totalAmount: toNumber(row.GrandTotal),
        amountPaid: toNumber(row.paid_amount),
        paymentStatus: mapLegacyPaymentStatus(row.payment_statut),
        status: String(row.statut ?? "received"),
        notes: row.notes ? String(row.notes) : null,
        legacyMeta: {
          saleOldId: saleOld != null ? String(saleOld) : null,
          warehouseOldId:
            row.warehouse_id != null ? String(row.warehouse_id) : null,
          userOldId: row.user_id != null ? String(row.user_id) : null,
        } satisfies Prisma.InputJsonObject,
        createdAt,
        updatedAt: createdAt,
        lines:
          lineCreates.length > 0
            ? {
                create: lineCreates.map((l) => ({
                  productId: l.productId,
                  variantId: l.variantId,
                  quantity: l.quantity,
                  unitPrice: l.unitPrice,
                  lineTotal: l.lineTotal,
                  lineLabel: l.lineLabel,
                  legacyDetailOldId: l.legacyDetailOldId,
                })),
              }
            : undefined,
      };

      let record;
      if (existing) {
        if (options.updateExisting) {
          await prisma.saleReturnLine.deleteMany({
            where: { saleReturnId: existing.id },
          });
          record = await prisma.saleReturn.update({
            where: { id: existing.id },
            data: { ...data, lines: data.lines },
          });
        } else {
          record = existing;
        }
      } else {
        record = await prisma.saleReturn.create({ data });
      }

      const skipped =
        !!existing && !options.updateExisting && options.skipDuplicates;

      maps.set("sale_returns", oldId, record.id);
      await logMigration({
        businessId,
        importSessionId: sessionId,
        tableName: "sale_returns",
        oldId,
        newId: record.id,
        status: skipped ? "SKIPPED" : "SUCCESS",
      });
      track("sale_returns", skipped ? "skipped" : "success");
    } catch (e) {
      await onError(
        "sale_returns",
        oldId,
        e instanceof Error ? e.message : "Failed",
        row,
      );
    }
  }
}

/** Historical stock adjustments — audit trail only (does not change current stock). */
export async function importLegacyAdjustments(
  businessId: string,
  sessionId: string,
  parsed: ParsedMysqlDump,
  maps: ImportIdMaps,
  track: TrackFn,
  onError: OnErrorFn,
) {
  const rows = filterActiveRows(getTableRows(parsed.inserts.adjustment_details));
  for (const row of rows) {
    const oldId = oldIdKey(row);
    try {
      const productId = maps.get("products", toBigInt(row.product_id));
      if (!productId) throw new Error("Product not found for adjustment line");

      const variantOld = toBigInt(row.product_variant_id);
      const variantId =
        variantOld && Number(variantOld) !== 0
          ? maps.get("variants", variantOld) ?? null
          : null;

      const qty = toNumber(row.quantity);
      const type = String(row.type ?? "add").toLowerCase();
      const signed = type === "sub" || type === "subtract" ? -qty : qty;

      const adjOld = toBigInt(row.adjustment_id);

      await prisma.stockHistory.create({
        data: {
          productId,
          variantId,
          action: "MANUAL_ADJUSTMENT",
          oldQuantity: null,
          newQuantity: 0,
          quantityChanged: signed,
          note: `Legacy adjustment ${adjOld ?? "?"} (${type}) — historical record only`,
          referenceType: "legacy_adjustment",
          referenceId: adjOld ? String(adjOld) : undefined,
        },
      });

      await logMigration({
        businessId,
        importSessionId: sessionId,
        tableName: "adjustment_details",
        oldId,
        newId: productId,
        status: "SUCCESS",
        message: "Recorded as stock history (no stock mutation)",
      });
      track("adjustment_details", "success");
    } catch (e) {
      await onError(
        "adjustment_details",
        oldId,
        e instanceof Error ? e.message : "Failed",
        row,
      );
    }
  }
}
