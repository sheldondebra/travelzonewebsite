import { prisma } from "@/lib/prisma";

export async function recalculateReputation(businessId: string) {
  const [reviews, orders] = await Promise.all([
    prisma.businessReview.aggregate({
      where: { businessId },
      _avg: { rating: true },
      _count: true,
    }),
    prisma.order.groupBy({
      by: ["deliveryStatus"],
      where: { businessId },
      _count: true,
    }),
  ]);

  const total = orders.reduce((s, o) => s + o._count, 0);
  const delivered =
    orders.find((o) => o.deliveryStatus === "delivered")?._count ?? 0;
  const deliveryScore = total > 0 ? (delivered / total) * 5 : 2.5;
  const ratingScore = reviews._avg.rating ?? 3;
  const score = ratingScore * 0.6 + deliveryScore * 0.4;

  await prisma.business.update({
    where: { id: businessId },
    data: { reputationScore: Math.round(score * 10) / 10 },
  });

  return score;
}
