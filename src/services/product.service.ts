import { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { describeDbError, isDbUnavailable } from "@/lib/db-health";
import { ConflictError, NotFoundError, ValidationError } from "@/lib/errors";
import { CATALOGUE, PRODUCT_STATUS } from "@/lib/constants";
import { slugify } from "@/lib/slug";
import type { ProductListParams, ProductDto, Paginated } from "@/types";
import type { ProductCreateInput, ProductUpdateInput } from "@/validations/schemas";
import { toProductDto } from "./mappers";

/**
 * Product service — all catalogue business rules live here, independent of
 * HTTP handlers, React components and the storage backend.
 */

async function assertSlugAvailable(slug: string, excludeId?: string): Promise<void> {
  const existing = await db.product.findUnique({ where: { slug }, select: { id: true } });
  if (existing && existing.id !== excludeId) {
    throw new ConflictError(`The URL slug "${slug}" is already used by another product.`, {
      field: "slug",
    });
  }
}

async function assertSkuAvailable(sku: string, excludeId?: string): Promise<void> {
  const existing = await db.product.findUnique({ where: { sku }, select: { id: true } });
  if (existing && existing.id !== excludeId) {
    throw new ConflictError(`Product code "${sku}" already exists.`, { field: "sku" });
  }
}

async function assertCategoryExists(categoryId: string): Promise<void> {
  const category = await db.category.findUnique({ where: { id: categoryId }, select: { id: true } });
  if (!category) {
    throw new ValidationError("Choose a valid category.", { field: "categoryId" });
  }
}

function buildImageData(
  images: NonNullable<ProductCreateInput["images"]> | undefined,
  productName: string,
): Array<{ imageKey: string; altText: string | null; sortOrder: number; isPrimary: boolean }> {
  if (!images?.length) return [];
  return images.map((image, index) => ({
    imageKey: image.imageKey,
    altText: image.altText?.trim() || `${productName} — photo ${index + 1}`,
    sortOrder: image.sortOrder ?? index,
    isPrimary: image.isPrimary ?? index === 0,
  }));
}

const productInclude = {
  category: { select: { name: true, slug: true } },
  images: true,
} satisfies Prisma.ProductInclude;

type ProductRow = Prisma.ProductGetPayload<{ include: typeof productInclude }>;

async function getRow(id: string): Promise<ProductRow> {
  const product = await db.product.findUnique({ where: { id }, include: productInclude });
  if (!product) throw new NotFoundError("Product not found.");
  return product;
}

async function getRowBySlug(slug: string): Promise<ProductRow> {
  const product = await db.product.findUnique({ where: { slug }, include: productInclude });
  if (!product) throw new NotFoundError("Product not found.");
  return product;
}

// ---------------------------------------------------------------------------
// Queries
// ---------------------------------------------------------------------------

export interface PublicListOptions {
  search?: string;
  categorySlug?: string;
  featuredOnly?: boolean;
  sort?: ProductListParams["sort"];
  page?: number;
  pageSize?: number;
}

/** Public catalogue listing — never returns drafts or hidden-category items.
 *  Falls back to an empty listing when the database is unreachable or has not
 *  been migrated yet, so the catalogue page renders instead of erroring out. */
export async function listPublicProducts(options: PublicListOptions = {}): Promise<Paginated<ProductDto>> {
  const page = Math.max(1, options.page ?? 1);
  const pageSize = Math.min(CATALOGUE.pageSize * 3, Math.max(1, options.pageSize ?? CATALOGUE.pageSize));

  const where: Prisma.ProductWhereInput = {
    status: PRODUCT_STATUS.PUBLISHED,
    category: { isActive: true },
  };

  if (options.search) {
    where.OR = [
      { name: { contains: options.search } },
      { shortDescription: { contains: options.search } },
      { material: { contains: options.search } },
      { sku: { contains: options.search } },
    ];
  }

  if (options.categorySlug) where.category = { isActive: true, slug: options.categorySlug };
  if (options.featuredOnly) where.isFeatured = true;

  const orderBy: Prisma.ProductOrderByWithRelationInput = (() => {
    switch (options.sort) {
      case "price-asc":
        return { price: "asc" as const };
      case "price-desc":
        return { price: "desc" as const };
      case "name-asc":
        return { name: "asc" as const };
      default:
        return { createdAt: "desc" as const };
    }
  })();

  try {
    const [rows, total] = await Promise.all([
      db.product.findMany({
        where,
        include: productInclude,
        orderBy: [orderBy],
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      db.product.count({ where }),
    ]);

    return {
      items: rows.map(toProductDto),
      total,
      page,
      pageSize,
      totalPages: Math.max(1, Math.ceil(total / pageSize)),
    };
  } catch (error) {
    if (isDbUnavailable(error)) {
      console.error(`[products] database unavailable, serving empty catalogue — ${describeDbError(error)}`);
      return { items: [], total: 0, page, pageSize, totalPages: 1 };
    }
    throw error;
  }
}

/** Get one published product for the public detail page. A database that is
 *  unreachable/not migrated renders as a 404 instead of a server error. */
export async function getPublicProductBySlug(slug: string): Promise<ProductDto> {
  try {
    const row = await getRowBySlug(slug);
    if (row.status !== PRODUCT_STATUS.PUBLISHED || !row.category?.slug) {
      throw new NotFoundError("Product not found.");
    }
    return toProductDto(row);
  } catch (error) {
    if (isDbUnavailable(error)) {
      console.error(`[products] database unavailable for detail page — ${describeDbError(error)}`);
      throw new NotFoundError("Product not found.");
    }
    throw error;
  }
}

/** Related products: same category first, newest otherwise. */
export async function getRelatedProducts(product: ProductDto, limit = CATALOGUE.relatedProducts): Promise<ProductDto[]> {
  try {
    const rows = await db.product.findMany({
      where: {
        status: PRODUCT_STATUS.PUBLISHED,
        id: { not: product.id },
        OR: [{ categoryId: product.categoryId }, {}],
      },
      include: productInclude,
      orderBy: [{ categoryId: product.categoryId ? "asc" : "asc" }, { createdAt: "desc" as const }],
      take: limit * 2,
    });

    const sameCategory = rows.filter((row) => row.categoryId === product.categoryId);
    const others = rows.filter((row) => row.categoryId !== product.categoryId);
    return [...sameCategory, ...others].slice(0, limit).map(toProductDto);
  } catch (error) {
    if (isDbUnavailable(error)) return [];
    throw error;
  }
}

/** Admin listing with full filters (drafts included). */
export async function listProductsForAdmin(params: ProductListParams): Promise<Paginated<ProductDto>> {
  const page = Math.max(1, params.page ?? 1);
  const pageSize = Math.min(60, Math.max(1, params.pageSize ?? 20));

  const where: Prisma.ProductWhereInput = {};
  if (params.status && params.status !== "ALL") where.status = params.status;
  if (params.availability && params.availability !== "ALL") where.availability = params.availability;
  if (params.categoryId) where.categoryId = params.categoryId;
  if (params.featured !== undefined) where.isFeatured = params.featured;
  if (params.search) {
    where.OR = [
      { name: { contains: params.search } },
      { sku: { contains: params.search } },
    ];
  }

  const orderBy: Prisma.ProductOrderByWithRelationInput =
    params.sort === "price-asc"
      ? { price: "asc" }
      : params.sort === "price-desc"
        ? { price: "desc" }
        : params.sort === "name-asc"
          ? { name: "asc" }
          : { updatedAt: "desc" };

  const [rows, total] = await Promise.all([
    db.product.findMany({
      where,
      include: productInclude,
      orderBy,
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    db.product.count({ where }),
  ]);

  return {
    items: rows.map(toProductDto),
    total,
    page,
    pageSize,
    totalPages: Math.max(1, Math.ceil(total / pageSize)),
  };
}

/** Single product for the admin (any status). */
export async function getProductById(id: string): Promise<ProductDto> {
  return toProductDto(await getRow(id));
}

// ---------------------------------------------------------------------------
// Mutations
// ---------------------------------------------------------------------------

export async function createProduct(input: ProductCreateInput): Promise<ProductDto> {
  const slug = input.slug?.trim() || slugify(input.name);
  await Promise.all([
    assertSlugAvailable(slug),
    assertSkuAvailable(input.sku),
    assertCategoryExists(input.categoryId),
  ]);

  const created = await db.product.create({
    data: {
      name: input.name,
      slug,
      sku: input.sku.toUpperCase(),
      categoryId: input.categoryId,
      shortDescription: input.shortDescription ?? null,
      description: input.description ?? null,
      price: input.price ?? null,
      originalPrice: input.originalPrice ?? null,
      dimensionWidth: input.dimensions?.width ?? null,
      dimensionDepth: input.dimensions?.depth ?? null,
      dimensionHeight: input.dimensions?.height ?? null,
      dimensionUnit: input.dimensions?.unit ?? "cm",
      material: input.material ?? null,
      finish: input.finish ?? null,
      colours: input.colours?.length ? JSON.stringify(input.colours) : null,
      availability: input.availability,
      deliveryInfo: input.deliveryInfo ?? null,
      isFeatured: input.isFeatured ?? false,
      status: input.status,
      seoTitle: input.seoTitle ?? null,
      seoDescription: input.seoDescription ?? null,
      images: { create: buildImageData(input.images, input.name) },
    },
    include: productInclude,
  });

  return toProductDto(created);
}

export async function updateProduct(id: string, input: ProductUpdateInput): Promise<ProductDto> {
  const existing = await getRow(id);

  const slug = input.slug !== undefined ? input.slug : existing.slug;
  if (slug !== existing.slug) await assertSlugAvailable(slug, id);
  if (input.sku && input.sku.toUpperCase() !== existing.sku) await assertSkuAvailable(input.sku, id);
  if (input.categoryId && input.categoryId !== existing.categoryId) {
    await assertCategoryExists(input.categoryId);
  }

  const images = input.images;
  if (images) {
    // Replace-the-set semantics with reference safety: delete removed rows,
    // upsert existing ones (preserving ids), create the new ones.
    const keptIds = images.map((image) => image.id).filter((imageId): imageId is string => Boolean(imageId));
    await db.productImage.deleteMany({
      where: { productId: id, id: { notIn: keptIds } },
    });

    for (const [index, image] of images.entries()) {
      const data = {
        imageKey: image.imageKey,
        altText: image.altText?.trim() || `${input.name ?? existing.name} — photo ${index + 1}`,
        sortOrder: image.sortOrder ?? index,
        isPrimary: image.isPrimary ?? index === 0,
      };
      if (image.id) {
        await db.productImage.updateMany({
          where: { id: image.id, productId: id },
          data,
        });
      } else {
        await db.productImage.create({ data: { ...data, productId: id } });
      }
    }

    // Guarantee exactly one primary image.
    const primaryId = images.find((image) => image.isPrimary)?.id;
    await db.productImage.updateMany({
      where: { productId: id, id: { not: primaryId ?? "__none__" } },
      data: { isPrimary: false },
    });
    if (primaryId) {
      await db.productImage.update({ where: { id: primaryId }, data: { isPrimary: true } });
    } else {
      const first = await db.productImage.findFirst({ where: { productId: id }, orderBy: { sortOrder: "asc" } });
      if (first) await db.productImage.update({ where: { id: first.id }, data: { isPrimary: true } });
    }
  }

  const updated = await db.product.update({
    where: { id },
    data: {
      ...(input.name !== undefined ? { name: input.name } : {}),
      ...(input.slug !== undefined ? { slug } : {}),
      ...(input.sku !== undefined ? { sku: input.sku.toUpperCase() } : {}),
      ...(input.categoryId !== undefined ? { categoryId: input.categoryId } : {}),
      ...(input.shortDescription !== undefined ? { shortDescription: input.shortDescription } : {}),
      ...(input.description !== undefined ? { description: input.description } : {}),
      ...(input.price !== undefined ? { price: input.price } : {}),
      ...(input.originalPrice !== undefined ? { originalPrice: input.originalPrice } : {}),
      ...(input.dimensions !== undefined
        ? {
            dimensionWidth: input.dimensions?.width ?? null,
            dimensionDepth: input.dimensions?.depth ?? null,
            dimensionHeight: input.dimensions?.height ?? null,
            dimensionUnit: input.dimensions?.unit ?? "cm",
          }
        : {}),
      ...(input.material !== undefined ? { material: input.material } : {}),
      ...(input.finish !== undefined ? { finish: input.finish } : {}),
      ...(input.colours !== undefined
        ? { colours: input.colours.length ? JSON.stringify(input.colours) : null }
        : {}),
      ...(input.availability !== undefined ? { availability: input.availability } : {}),
      ...(input.deliveryInfo !== undefined ? { deliveryInfo: input.deliveryInfo } : {}),
      ...(input.isFeatured !== undefined ? { isFeatured: input.isFeatured } : {}),
      ...(input.status !== undefined ? { status: input.status } : {}),
      ...(input.seoTitle !== undefined ? { seoTitle: input.seoTitle } : {}),
      ...(input.seoDescription !== undefined ? { seoDescription: input.seoDescription } : {}),
    },
    include: productInclude,
  });

  return toProductDto(updated);
}

/** Publish / unpublish. */
export async function setProductStatus(id: string, status: ProductDto["status"]): Promise<ProductDto> {
  await getRow(id);
  const updated = await db.product.update({ where: { id }, data: { status }, include: productInclude });
  return toProductDto(updated);
}

/** Duplicate a product into a draft with a unique SKU/slug. */
export async function duplicateProduct(id: string): Promise<ProductDto> {
  const source = await getRow(id);

  let suffix = 2;
  let newSku = `${source.sku}-COPY`;
   
  while (true) {
    const clash = await db.product.findFirst({ where: { sku: newSku }, select: { id: true } });
    if (!clash) break;
    newSku = `${source.sku}-COPY-${suffix++}`;
  }

  const baseSlug = slugify(`${source.name}-copy`);
  let newSlug = baseSlug;
  suffix = 2;
   
  while (true) {
    const clash = await db.product.findUnique({ where: { slug: newSlug }, select: { id: true } });
    if (!clash) break;
    newSlug = `${baseSlug}-${suffix++}`;
  }

  const created = await db.product.create({
    data: {
      name: `${source.name} (Copy)`,
      slug: newSlug,
      sku: newSku,
      categoryId: source.categoryId,
      shortDescription: source.shortDescription,
      description: source.description,
      price: source.price,
      originalPrice: source.originalPrice,
      dimensionWidth: source.dimensionWidth,
      dimensionDepth: source.dimensionDepth,
      dimensionHeight: source.dimensionHeight,
      dimensionUnit: source.dimensionUnit,
      material: source.material,
      finish: source.finish,
      colours: source.colours,
      availability: source.availability,
      deliveryInfo: source.deliveryInfo,
      isFeatured: false,
      status: PRODUCT_STATUS.DRAFT,
      seoTitle: source.seoTitle,
      seoDescription: source.seoDescription,
      images: {
        create: source.images
          .slice()
          .sort((a, b) => a.sortOrder - b.sortOrder)
          .map((image) => ({
            imageKey: image.imageKey,
            altText: image.altText,
            sortOrder: image.sortOrder,
            isPrimary: image.isPrimary,
          })),
      },
    },
    include: productInclude,
  });

  return toProductDto(created);
}

/**
 * Delete a product and its image rows.
 *
 * Storage reaping is intentionally NOT done inline: the API route calls
 * `mediaService.reapOrphanKeys()` afterwards so files still referenced by
 * other products/settings are never removed.
 */
export async function deleteProduct(id: string): Promise<void> {
  await getRow(id);
  await db.product.delete({ where: { id } });
}
