import { db } from "@/lib/db";
import { PRODUCT_AVAILABILITY, PRODUCT_STATUS } from "@/lib/constants";
import type { DashboardStatsDto } from "@/types";

/**
 * Dashboard service — aggregate counters and the recently-edited list for
 * the admin overview. Counts run as parallel grouped queries.
 */

export async function getDashboardStats(): Promise<DashboardStatsDto> {
  const [totalProducts, published, drafts, unavailable, categories, mediaCount, recentProducts] =
    await Promise.all([
      db.product.count(),
      db.product.count({ where: { status: PRODUCT_STATUS.PUBLISHED } }),
      db.product.count({ where: { status: PRODUCT_STATUS.DRAFT } }),
      db.product.count({ where: { availability: PRODUCT_AVAILABILITY.UNAVAILABLE } }),
      db.category.count({ where: { isActive: true } }),
      db.mediaAsset.count(),
      db.product.findMany({
        orderBy: { updatedAt: "desc" },
        take: 6,
        select: { id: true, name: true, sku: true, status: true, updatedAt: true },
      }),
    ]);

  return {
    totalProducts,
    published,
    drafts,
    unavailable,
    categories,
    mediaCount,
    recentProducts: recentProducts.map((product) => ({
      id: product.id,
      name: product.name,
      sku: product.sku,
      status: product.status as DashboardStatsDto["recentProducts"][number]["status"],
      updatedAt: product.updatedAt.toISOString(),
    })),
  };
}
