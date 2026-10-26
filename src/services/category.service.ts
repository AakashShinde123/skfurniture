import { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { describeDbError, isDbUnavailable } from "@/lib/db-health";
import { ConflictError, NotFoundError, ValidationError } from "@/lib/errors";
import { slugify as slugifyText } from "@/lib/slug";
import type { CategoryDto } from "@/types";
import type { CategoryCreateInput, CategoryUpdateInput } from "@/validations/schemas";
import { toCategoryDto } from "./mappers";

/**
 * Category service — creation, activation, reordering and safe deletion.
 */

const categoryInclude = {
  _count: { select: { products: true } },
} satisfies Prisma.CategoryInclude;

async function assertSlugAvailable(slug: string, excludeId?: string): Promise<void> {
  const existing = await db.category.findUnique({ where: { slug }, select: { id: true } });
  if (existing && existing.id !== excludeId) {
    throw new ConflictError(`A category with the URL slug "${slug}" already exists.`, {
      field: "slug",
    });
  }
}

export async function listCategories(options: { includeInactive?: boolean; withCounts?: boolean } = {}): Promise<CategoryDto[]> {
  try {
    const rows = await db.category.findMany({
      where: options.includeInactive ? {} : { isActive: true },
      include: options.withCounts ? categoryInclude : undefined,
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    });
    return rows.map((row) => toCategoryDto(row as typeof rows[number] & { _count?: { products: number } }));
  } catch (error) {
    // Public listing (active only) degrades to an empty list when the
    // database is unreachable or not yet migrated — admin listings
    // (includeInactive) still surface the real error.
    if (!options.includeInactive && isDbUnavailable(error)) {
      console.error(`[categories] database unavailable, serving empty list — ${describeDbError(error)}`);
      return [];
    }
    throw error;
  }
}

export async function getCategoryById(id: string): Promise<CategoryDto> {
  const row = await db.category.findUnique({ where: { id }, include: categoryInclude });
  if (!row) throw new NotFoundError("Category not found.");
  return toCategoryDto(row);
}

export async function createCategory(input: CategoryCreateInput): Promise<CategoryDto> {
  const slug = input.slug?.trim() || slugifyText(input.name);
  await assertSlugAvailable(slug);

  const maxOrder = await db.category.aggregate({ _max: { sortOrder: true } });
  const created = await db.category.create({
    data: {
      name: input.name,
      slug,
      description: input.description ?? null,
      imageUrl: input.imageUrl ?? null,
      sortOrder: input.sortOrder ?? (maxOrder._max.sortOrder ?? -1) + 1,
      isActive: input.isActive ?? true,
    },
    include: categoryInclude,
  });
  return toCategoryDto(created);
}

export async function updateCategory(id: string, input: CategoryUpdateInput): Promise<CategoryDto> {
  const existing = await db.category.findUnique({ where: { id } });
  if (!existing) throw new NotFoundError("Category not found.");

  if (input.slug && input.slug !== existing.slug) await assertSlugAvailable(input.slug, id);

  const updated = await db.category.update({
    where: { id },
    data: {
      ...(input.name !== undefined ? { name: input.name } : {}),
      ...(input.slug !== undefined ? { slug: input.slug } : {}),
      ...(input.description !== undefined ? { description: input.description } : {}),
      ...(input.imageUrl !== undefined ? { imageUrl: input.imageUrl } : {}),
      ...(input.sortOrder !== undefined ? { sortOrder: input.sortOrder } : {}),
      ...(input.isActive !== undefined ? { isActive: input.isActive } : {}),
    },
    include: categoryInclude,
  });
  return toCategoryDto(updated);
}

/** Reorder by overwriting sort_order in the submitted sequence. */
export async function reorderCategories(orderedIds: string[]): Promise<CategoryDto[]> {
  const existing = await db.category.findMany({ select: { id: true } });
  const existingIds = new Set(existing.map((category) => category.id));
  if (orderedIds.some((id) => !existingIds.has(id))) {
    throw new ValidationError("One or more categories could not be found.");
  }

  await db.$transaction(
    orderedIds.map((id, index) =>
      db.category.update({ where: { id }, data: { sortOrder: index } }),
    ),
  );

  return listCategories({ includeInactive: true, withCounts: true });
}

/**
 * Deletion is refused while products still reference the category — the admin
 * must move or delete them first. This protects the public catalogue from
 * silently losing items.
 */
export async function deleteCategory(id: string): Promise<void> {
  const category = await db.category.findUnique({
    where: { id },
    include: { _count: { select: { products: true } } },
  });
  if (!category) throw new NotFoundError("Category not found.");
  if (category._count.products > 0) {
    throw new ConflictError(
      `This category still has ${category._count.products} product${category._count.products === 1 ? "" : "s"}. Move or delete them first.`,
    );
  }
  await db.category.delete({ where: { id } });
}
