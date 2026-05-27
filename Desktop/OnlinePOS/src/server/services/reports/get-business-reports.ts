import { endOfDay, endOfMonth, startOfDay, startOfMonth } from "date-fns";
import {
  DELIVERY_STATUS_LABELS,
  DELIVERY_STATUSES,
  getDeliveryFromMeta,
} from "@/lib/orders/delivery";
import { prisma } from "@/lib/prisma";
import { getExpenseTotal } from "@/server/services/expense/list-expenses";

export type ReportPeriod = { from: Date; to: Date };

function resolvePeriod(from?: Date, to?: Date): ReportPeriod {
  const start = from ? startOfDay(from) : startOfMonth(new Date());
  const end = to ? endOfDay(to) : endOfMonth(new Date());
  return { from: start, to: end };
}

const PAYMENT_LABELS: Record<string, string> = {
  CASH: "Cash",
  MOMO: "Mobile Money",
  BANK_TRANSFER: "Bank Transfer",
  CARD: "Card",
};

export async function getBusinessReports(
  businessId: string,
  from?: Date,
  to?: Date,
) {
  const period = resolvePeriod(from, to);
  const { from: start, to: end } = period;

  const business = await prisma.business.findUnique({
    where: { id: businessId },
    select: { currency: true, lowStockThreshold: true },
  });
  const threshold = business?.lowStockThreshold ?? 5;
  const currency = business?.currency ?? "GHS";

  const orderWhere = {
    businessId,
    createdAt: { gte: start, lte: end },
  };

  const [
    products,
    orderAgg,
    orders,
    orderItems,
    purchaseOrders,
    expensesTotal,
    expensesByCategory,
    outstanding,
    inventoryMovements,
  ] = await Promise.all([
    prisma.product.findMany({
      where: { businessId, deletedAt: null },
      select: {
        id: true,
        name: true,
        sku: true,
        stockQuantity: true,
        stockAlert: true,
        costPrice: true,
        price: true,
        productType: true,
        categoryRef: { select: { name: true } },
        brandRef: { select: { name: true } },
        stocks: {
          select: {
            quantity: true,
            warehouse: { select: { id: true, name: true } },
          },
        },
      },
    }),
    prisma.order.aggregate({
      where: orderWhere,
      _sum: { totalAmount: true, profit: true, amountPaid: true },
      _count: true,
    }),
    prisma.order.findMany({
      where: orderWhere,
      select: {
        id: true,
        reference: true,
        createdAt: true,
        paymentMethod: true,
        totalAmount: true,
        amountPaid: true,
        paymentStatus: true,
        deliveryStatus: true,
        legacyMeta: true,
        customer: {
          select: {
            id: true,
            name: true,
            phone: true,
          },
        },
      },
    }),
    prisma.orderItem.findMany({
      where: { order: orderWhere },
      select: {
        quantity: true,
        price: true,
        product: {
          select: {
            id: true,
            name: true,
            sku: true,
            price: true,
            costPrice: true,
            stockQuantity: true,
            categoryRef: { select: { name: true } },
            brandRef: { select: { name: true } },
            category: true,
            brand: true,
          },
        },
      },
    }),
    prisma.purchaseOrder.findMany({
      where: { businessId, createdAt: { gte: start, lte: end } },
      include: {
        supplier: { select: { name: true } },
        items: {
          select: {
            quantityOrdered: true,
            quantityReceived: true,
            unitCost: true,
          },
        },
      },
    }),
    getExpenseTotal(businessId, start, end),
    prisma.expense.groupBy({
      by: ["category"],
      where: { businessId, date: { gte: start, lte: end } },
      _sum: { amount: true },
    }),
    prisma.order.aggregate({
      where: {
        businessId,
        paymentStatus: { in: ["pending", "partially_paid"] },
      },
      _sum: { totalAmount: true, amountPaid: true },
    }),
    prisma.inventoryMovement.groupBy({
      by: ["type"],
      where: { businessId, createdAt: { gte: start, lte: end } },
      _sum: { quantity: true },
      _count: true,
    }),
  ]);

  // —— Stock ——
  let totalUnits = 0;
  let inventoryValue = 0;
  let retailValue = 0;
  let lowStockCount = 0;
  let outOfStockCount = 0;
  const warehouseMap = new Map<
    string,
    { warehouseId: string; name: string; units: number; value: number }
  >();

  const lowStockItems: {
    name: string;
    sku: string | null;
    quantity: number;
    alert: number;
  }[] = [];

  for (const p of products) {
    const qty = p.stockQuantity;
    totalUnits += qty;
    inventoryValue += qty * p.costPrice;
    retailValue += qty * p.price;
    if (qty <= 0) outOfStockCount++;
    else if (qty <= (p.stockAlert || threshold)) {
      lowStockCount++;
      lowStockItems.push({
        name: p.name,
        sku: p.sku,
        quantity: qty,
        alert: p.stockAlert || threshold,
      });
    }

    if (p.stocks.length > 0) {
      for (const s of p.stocks) {
        const whId = s.warehouse?.id ?? "none";
        const whName = s.warehouse?.name ?? "Unassigned";
        const existing = warehouseMap.get(whId) ?? {
          warehouseId: whId,
          name: whName,
          units: 0,
          value: 0,
        };
        existing.units += s.quantity;
        existing.value += s.quantity * p.costPrice;
        warehouseMap.set(whId, existing);
      }
    }
  }

  lowStockItems.sort((a, b) => a.quantity - b.quantity);

  // —— Sales breakdowns ——
  const categoryMap = new Map<
    string,
    { name: string; quantity: number; revenue: number }
  >();
  const brandMap = new Map<
    string,
    { name: string; quantity: number; revenue: number }
  >();
  const productSalesMap = new Map<
    string,
    {
      id: string;
      name: string;
      sku: string | null;
      quantity: number;
      revenue: number;
      stockQuantity: number;
    }
  >();

  for (const item of orderItems) {
    const lineRevenue = item.price * item.quantity;
    const catName =
      item.product.categoryRef?.name ??
      item.product.category ??
      "Uncategorized";
    const brandName =
      item.product.brandRef?.name ?? item.product.brand ?? "No brand";

    const cat = categoryMap.get(catName) ?? {
      name: catName,
      quantity: 0,
      revenue: 0,
    };
    cat.quantity += item.quantity;
    cat.revenue += lineRevenue;
    categoryMap.set(catName, cat);

    const br = brandMap.get(brandName) ?? {
      name: brandName,
      quantity: 0,
      revenue: 0,
    };
    br.quantity += item.quantity;
    br.revenue += lineRevenue;
    brandMap.set(brandName, br);

    const product = productSalesMap.get(item.product.id) ?? {
      id: item.product.id,
      name: item.product.name,
      sku: item.product.sku,
      quantity: 0,
      revenue: 0,
      stockQuantity: item.product.stockQuantity,
    };
    product.quantity += item.quantity;
    product.revenue += lineRevenue;
    productSalesMap.set(item.product.id, product);
  }

  const paymentMap = new Map<
    string,
    { method: string; label: string; count: number; revenue: number; collected: number }
  >();
  const customerMap = new Map<
    string,
    {
      id: string;
      name: string;
      phone: string | null;
      orderCount: number;
      revenue: number;
      collected: number;
      outstanding: number;
      lastOrderAt: Date;
    }
  >();
  const deliveryStatusMap = new Map<
    string,
    { status: string; label: string; count: number; value: number }
  >();
  const deliveryRiderMap = new Map<
    string,
    { name: string; phone: string | null; count: number; value: number }
  >();
  const deliveryLocationMap = new Map<
    string,
    { name: string; city: string; region: string; count: number; value: number }
  >();
  const deliveryRows: {
    id: string;
    reference: string | null;
    createdAt: Date;
    customerName: string;
    customerPhone: string | null;
    status: string;
    statusLabel: string;
    riderName: string | null;
    riderPhone: string | null;
    city: string | null;
    region: string | null;
    scheduledAt: string | null;
    trackingNumber: string | null;
    totalAmount: number;
  }[] = [];

  for (const o of orders) {
    const key = o.paymentMethod ?? "UNSPECIFIED";
    const label = o.paymentMethod
      ? (PAYMENT_LABELS[o.paymentMethod] ?? o.paymentMethod)
      : "Not specified";
    const row = paymentMap.get(key) ?? {
      method: key,
      label,
      count: 0,
      revenue: 0,
      collected: 0,
    };
    row.count++;
    row.revenue += o.totalAmount;
    row.collected += o.amountPaid;
    paymentMap.set(key, row);

    const customer = customerMap.get(o.customer.id) ?? {
      id: o.customer.id,
      name: o.customer.name,
      phone: o.customer.phone,
      orderCount: 0,
      revenue: 0,
      collected: 0,
      outstanding: 0,
      lastOrderAt: o.createdAt,
    };
    customer.orderCount++;
    customer.revenue += o.totalAmount;
    customer.collected += o.amountPaid;
    customer.outstanding += Math.max(0, o.totalAmount - o.amountPaid);
    if (o.createdAt > customer.lastOrderAt) {
      customer.lastOrderAt = o.createdAt;
    }
    customerMap.set(o.customer.id, customer);

    const deliveryDetails = getDeliveryFromMeta(o.legacyMeta);
    const statusLabel =
      DELIVERY_STATUS_LABELS[o.deliveryStatus as keyof typeof DELIVERY_STATUS_LABELS] ??
      o.deliveryStatus;
    const statusRow = deliveryStatusMap.get(o.deliveryStatus) ?? {
      status: o.deliveryStatus,
      label: statusLabel,
      count: 0,
      value: 0,
    };
    statusRow.count++;
    statusRow.value += o.totalAmount;
    deliveryStatusMap.set(o.deliveryStatus, statusRow);

    if (deliveryDetails.riderName) {
      const rider = deliveryRiderMap.get(deliveryDetails.riderName) ?? {
        name: deliveryDetails.riderName,
        phone: deliveryDetails.riderPhone ?? null,
        count: 0,
        value: 0,
      };
      rider.count++;
      rider.value += o.totalAmount;
      deliveryRiderMap.set(deliveryDetails.riderName, rider);
    }

    if (deliveryDetails.city || deliveryDetails.region) {
      const city = deliveryDetails.city ?? "Unknown city";
      const region = deliveryDetails.region ?? "Unknown region";
      const locationKey = `${city}::${region}`;
      const location = deliveryLocationMap.get(locationKey) ?? {
        name: `${city}, ${region}`,
        city,
        region,
        count: 0,
        value: 0,
      };
      location.count++;
      location.value += o.totalAmount;
      deliveryLocationMap.set(locationKey, location);
    }

    deliveryRows.push({
      id: o.id,
      reference: o.reference,
      createdAt: o.createdAt,
      customerName: o.customer.name,
      customerPhone: deliveryDetails.phone ?? o.customer.phone,
      status: o.deliveryStatus,
      statusLabel,
      riderName: deliveryDetails.riderName ?? null,
      riderPhone: deliveryDetails.riderPhone ?? null,
      city: deliveryDetails.city ?? null,
      region: deliveryDetails.region ?? null,
      scheduledAt: deliveryDetails.scheduledAt ?? null,
      trackingNumber: deliveryDetails.trackingNumber ?? null,
      totalAmount: o.totalAmount,
    });
  }

  const revenue = orderAgg._sum.totalAmount ?? 0;
  const grossProfit = orderAgg._sum.profit ?? 0;
  const orderCount = orderAgg._count;
  const collected = orderAgg._sum.amountPaid ?? 0;
  const netProfit = grossProfit - expensesTotal;
  const outstandingAmount =
    (outstanding._sum.totalAmount ?? 0) -
    (outstanding._sum.amountPaid ?? 0);

  // —— Purchases ——
  const purchaseByStatus = new Map<
    string,
    { status: string; count: number; amount: number }
  >();
  const purchaseBySupplier = new Map<
    string,
    { name: string; count: number; amount: number }
  >();
  let purchaseUnitsOrdered = 0;
  let purchaseUnitsReceived = 0;

  for (const po of purchaseOrders) {
    const st = purchaseByStatus.get(po.status) ?? {
      status: po.status,
      count: 0,
      amount: 0,
    };
    st.count++;
    st.amount += po.totalAmount;
    purchaseByStatus.set(po.status, st);

    const supName = po.supplier.name;
    const sup = purchaseBySupplier.get(supName) ?? {
      name: supName,
      count: 0,
      amount: 0,
    };
    sup.count++;
    sup.amount += po.totalAmount;
    purchaseBySupplier.set(supName, sup);

    for (const line of po.items) {
      purchaseUnitsOrdered += line.quantityOrdered;
      purchaseUnitsReceived += line.quantityReceived;
    }
  }

  const sortByRevenue = <T extends { revenue: number }>(a: T, b: T) =>
    b.revenue - a.revenue;
  const topProducts = [...productSalesMap.values()].sort(sortByRevenue);
  const productIdsWithSales = new Set(topProducts.map((p) => p.id));
  const unsoldProducts = products
    .filter((p) => !productIdsWithSales.has(p.id))
    .map((p) => ({
      id: p.id,
      name: p.name,
      sku: p.sku,
      stockQuantity: p.stockQuantity,
      inventoryValue: p.stockQuantity * p.costPrice,
      retailValue: p.stockQuantity * p.price,
    }))
    .sort((a, b) => b.retailValue - a.retailValue);
  const expenseRows = expensesByCategory
    .map((e) => ({
      category: e.category,
      amount: e._sum.amount ?? 0,
    }))
    .sort((a, b) => b.amount - a.amount);
  const deliveryByStatus = DELIVERY_STATUSES.map((status) => {
    const existing = deliveryStatusMap.get(status);
    return (
      existing ?? {
        status,
        label: DELIVERY_STATUS_LABELS[status],
        count: 0,
        value: 0,
      }
    );
  }).concat(
    [...deliveryStatusMap.values()].filter(
      (row) => !DELIVERY_STATUSES.includes(row.status as (typeof DELIVERY_STATUSES)[number]),
    ),
  );

  return {
    period,
    currency,
    stock: {
      totalProducts: products.length,
      totalUnits: Math.round(totalUnits),
      inventoryValue,
      retailValue,
      lowStockCount,
      outOfStockCount,
      byWarehouse: [...warehouseMap.values()].sort((a, b) => b.value - a.value),
      lowStockItems: lowStockItems.slice(0, 25),
      movements: inventoryMovements.map((m) => ({
        type: m.type,
        count: m._count,
        quantity: m._sum.quantity ?? 0,
      })),
    },
    sales: {
      orderCount,
      revenue,
      profit: grossProfit,
      collected,
      averageOrderValue: orderCount > 0 ? revenue / orderCount : 0,
      byPaymentMethod: [...paymentMap.values()].sort(
        (a, b) => b.revenue - a.revenue,
      ),
      byCategory: [...categoryMap.values()].sort(sortByRevenue),
      byBrand: [...brandMap.values()].sort(sortByRevenue),
    },
    products: {
      totalProducts: products.length,
      soldProducts: topProducts.length,
      unsoldProducts: unsoldProducts.length,
      topProducts: topProducts.slice(0, 50),
      unsold: unsoldProducts.slice(0, 50),
    },
    customers: {
      totalCustomers: customerMap.size,
      repeatCustomers: [...customerMap.values()].filter((c) => c.orderCount > 1).length,
      topCustomers: [...customerMap.values()].sort((a, b) => b.revenue - a.revenue),
      outstanding: [...customerMap.values()]
        .filter((c) => c.outstanding > 0)
        .sort((a, b) => b.outstanding - a.outstanding),
    },
    delivery: {
      totalOrders: deliveryRows.length,
      activeOrders: deliveryRows.filter((r) =>
        ["pending", "processing", "shipped"].includes(r.status),
      ).length,
      deliveredOrders: deliveryRows.filter((r) => r.status === "delivered").length,
      scheduledOrders: deliveryRows.filter((r) => Boolean(r.scheduledAt)).length,
      byStatus: deliveryByStatus,
      byRider: [...deliveryRiderMap.values()].sort((a, b) => b.count - a.count),
      byLocation: [...deliveryLocationMap.values()].sort((a, b) => b.count - a.count),
      rows: deliveryRows.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()),
    },
    purchases: {
      orderCount: purchaseOrders.length,
      totalAmount: purchaseOrders.reduce((s, p) => s + p.totalAmount, 0),
      unitsOrdered: purchaseUnitsOrdered,
      unitsReceived: purchaseUnitsReceived,
      byStatus: [...purchaseByStatus.values()].sort(
        (a, b) => b.amount - a.amount,
      ),
      bySupplier: [...purchaseBySupplier.values()].sort(
        (a, b) => b.amount - a.amount,
      ),
    },
    profitAndLoss: {
      revenue,
      grossProfit,
      expenses: expensesTotal,
      netProfit,
      margin: revenue > 0 ? (netProfit / revenue) * 100 : 0,
      expenseByCategory: expenseRows,
    },
    expenses: {
      total: expensesTotal,
      byCategory: expenseRows,
    },
    cashFlow: {
      income: collected,
      expenses: expensesTotal,
      netCashFlow: collected - expensesTotal,
      outstandingPayments: outstandingAmount,
    },
  };
}

export type BusinessReports = Awaited<ReturnType<typeof getBusinessReports>>;
