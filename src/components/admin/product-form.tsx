"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2, Save, TriangleAlert } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DIMENSION_UNITS } from "@/lib/constants";
import { ApiClientError } from "@/lib/client/api";
import { slugify } from "@/lib/slug";
import { ImageUploader, type GalleryImage } from "./image-uploader";
import { useCreateProduct, useUpdateProduct } from "@/hooks/admin/use-products";
import { useAdminCategories } from "@/hooks/admin/use-categories";
import type { ProductDto } from "@/types";

/**
 * Product form (create + edit) — every PRD §5 field with server-shared
 * validation. Slug and SEO fields auto-generate editable defaults from the
 * product name; a dirty-state guard warns before leaving with unsaved work.
 */

const AVAILABILITY_OPTIONS = [
  { value: "AVAILABLE", label: "In stock" },
  { value: "UNAVAILABLE", label: "Currently unavailable" },
  { value: "MADE_TO_ORDER", label: "Made to order" },
] as const;

const productFormSchema = z.object({
  name: z.string().trim().min(2, "Product name must be at least 2 characters").max(140),
  sku: z
    .string()
    .trim()
    .min(2, "SKU is required")
    .max(40)
    .regex(/^[A-Za-z0-9-]+$/, "Letters, numbers and hyphens only (e.g. SOF001)"),
  slug: z
    .string()
    .trim()
    .regex(/^[a-z0-9]*(?:-[a-z0-9]+)*$/, "Lowercase letters, numbers and hyphens only"),
  categoryId: z.string().min(1, "Choose a category"),
  shortDescription: z.string().trim().max(300).optional(),
  description: z.string().trim().max(8000).optional(),
  price: z.string().trim().optional(),
  originalPrice: z.string().trim().optional(),
  dimensionWidth: z.string().trim().optional(),
  dimensionDepth: z.string().trim().optional(),
  dimensionHeight: z.string().trim().optional(),
  dimensionUnit: z.enum(DIMENSION_UNITS),
  material: z.string().trim().max(160).optional(),
  finish: z.string().trim().max(160).optional(),
  coloursText: z.string().trim().max(600).optional(),
  availability: z.enum(["AVAILABLE", "UNAVAILABLE", "MADE_TO_ORDER"]),
  deliveryInfo: z.string().trim().max(300).optional(),
  isFeatured: z.boolean(),
  published: z.boolean(),
  seoTitle: z.string().trim().max(180).optional(),
  seoDescription: z.string().trim().max(320).optional(),
});

type ProductFormValues = z.infer<typeof productFormSchema>;

interface ProductFormProps {
  product?: ProductDto; // present in edit mode
  shopName: string;
}

export function ProductForm({ product, shopName }: ProductFormProps) {
  const router = useRouter();
  const isEdit = Boolean(product);
  const { data: categories, isPending: categoriesPending } = useAdminCategories();
  const createMutation = useCreateProduct();
  const updateMutation = useUpdateProduct(product?.id ?? "");

  const [gallery, setGallery] = useState<GalleryImage[]>(
    product?.images.map((image) => ({
      imageKey: image.imageKey,
      altText: image.altText ?? "",
      isPrimary: image.isPrimary,
    })) ?? [],
  );
  const [slugManuallyEdited, setSlugManuallyEdited] = useState(isEdit);
  const [seoTitleManuallyEdited, setSeoTitleManuallyEdited] = useState(isEdit);
  const [seoDescManuallyEdited, setSeoDescManuallyEdited] = useState(isEdit);

  const {
    register,
    handleSubmit,
    control,
    watch,
    setValue,
    setError,
    formState: { errors, isDirty, isSubmitting },
  } = useForm<ProductFormValues>({
    resolver: zodResolver(productFormSchema),
    defaultValues: product
      ? {
          name: product.name,
          sku: product.sku,
          slug: product.slug,
          categoryId: product.categoryId,
          shortDescription: product.shortDescription ?? "",
          description: product.description ?? "",
          price: product.price !== null ? String(product.price) : "",
          originalPrice: product.originalPrice !== null ? String(product.originalPrice) : "",
          dimensionWidth: product.dimensions?.width?.toString() ?? "",
          dimensionDepth: product.dimensions?.depth?.toString() ?? "",
          dimensionHeight: product.dimensions?.height?.toString() ?? "",
          dimensionUnit: (product.dimensions?.unit as ProductFormValues["dimensionUnit"]) ?? "cm",
          material: product.material ?? "",
          finish: product.finish ?? "",
          coloursText: product.colours.join(", "),
          availability: product.availability,
          deliveryInfo: product.deliveryInfo ?? "",
          isFeatured: product.isFeatured,
          published: product.status === "PUBLISHED",
          seoTitle: product.seoTitle ?? "",
          seoDescription: product.seoDescription ?? "",
        }
      : {
          name: "",
          sku: "",
          slug: "",
          categoryId: "",
          shortDescription: "",
          description: "",
          price: "",
          originalPrice: "",
          dimensionWidth: "",
          dimensionDepth: "",
          dimensionHeight: "",
          dimensionUnit: "cm",
          material: "",
          finish: "",
          coloursText: "",
          availability: "AVAILABLE",
          deliveryInfo: "",
          isFeatured: false,
          published: false,
          seoTitle: "",
          seoDescription: "",
        },
  });

  const nameValue = watch("name");
  const seoTitleValue = watch("seoTitle");

  // Auto-generate the URL slug from the name until the admin edits it manually.
  useEffect(() => {
    if (!slugManuallyEdited && nameValue) {
      setValue("slug", slugify(nameValue), { shouldDirty: false });
    }
  }, [nameValue, slugManuallyEdited, setValue]);

  // Live SEO title preview.
  const seoPreview = useMemo(
    () => (seoTitleManuallyEdited && seoTitleValue ? seoTitleValue : `${nameValue || "Product"} | ${shopName}`),
    [seoTitleManuallyEdited, seoTitleValue, nameValue, shopName],
  );

  // Warn before closing the tab with unsaved changes.
  useEffect(() => {
    if (!isDirty) return;
    const handler = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = "";
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [isDirty]);

  const onSubmit = handleSubmit(async (values) => {
    if (gallery.length === 0) {
      toast.error("Add at least one product image.");
      return;
    }

    const payload = {
      name: values.name,
      sku: values.sku,
      slug: values.slug || slugify(values.name),
      categoryId: values.categoryId,
      shortDescription: values.shortDescription || null,
      description: values.description || null,
      price: values.price ? Number(values.price) : null,
      originalPrice: values.originalPrice ? Number(values.originalPrice) : null,
      dimensions:
        values.dimensionWidth || values.dimensionDepth || values.dimensionHeight
          ? {
              width: values.dimensionWidth ? Number(values.dimensionWidth) : null,
              depth: values.dimensionDepth ? Number(values.dimensionDepth) : null,
              height: values.dimensionHeight ? Number(values.dimensionHeight) : null,
              unit: values.dimensionUnit,
            }
          : null,
      material: values.material || null,
      finish: values.finish || null,
      colours: values.coloursText
        ? values.coloursText.split(",").map((colour) => colour.trim()).filter(Boolean)
        : [],
      availability: values.availability,
      deliveryInfo: values.deliveryInfo || null,
      isFeatured: values.isFeatured,
      status: values.published ? "PUBLISHED" : "DRAFT",
      seoTitle: (values.seoTitle || `${values.name} | ${shopName}`).slice(0, 180),
      seoDescription: values.seoDescription || values.shortDescription || null,
      images: gallery.map((image, index) => ({
        imageKey: image.imageKey,
        altText: image.altText || `${values.name} — photo ${index + 1}`,
        sortOrder: index,
        isPrimary: image.isPrimary || index === 0,
      })),
    };

    try {
      if (isEdit && product) {
        await updateMutation.mutateAsync(payload);
        router.push("/admin/products");
        router.refresh();
      } else {
        await createMutation.mutateAsync(payload);
        router.push("/admin/products");
        router.refresh();
      }
    } catch (error) {
      if (error instanceof ApiClientError) {
        const issues = error.fieldIssues;
        if (issues) {
          for (const issue of issues) {
            const field = issue.path === "slug" ? "slug" : (issue.path as keyof ProductFormValues);
            setError(field, { message: issue.message }, { shouldFocus: true });
          }
        }
        toast.error(error.message);
      } else {
        toast.error("Saving failed. Please try again.");
      }
    }
  });

  const pending = isSubmitting || createMutation.isPending || updateMutation.isPending;

  return (
    <form onSubmit={onSubmit} className="space-y-6 pb-24">
      <div className="grid gap-6 xl:grid-cols-3">
        {/* Main column */}
        <div className="space-y-6 xl:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Basics</CardTitle>
              <CardDescription>Product name, code and category — shown across the catalogue.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="name">Product name *</Label>
                <Input id="name" placeholder="e.g. Modern 3-Seater Fabric Sofa" {...register("name")} />
                {errors.name ? <FieldError message={errors.name.message} /> : null}
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="sku">SKU / product code *</Label>
                  <Input id="sku" placeholder="SOF001" className="font-mono" {...register("sku")} />
                  {errors.sku ? <FieldError message={errors.sku.message} /> : null}
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="categoryId">Category *</Label>
                  <Controller
                    control={control}
                    name="categoryId"
                    render={({ field }) => (
                      <Select value={field.value} onValueChange={field.onChange}>
                        <SelectTrigger id="categoryId" aria-label="Category">
                          <SelectValue placeholder={categoriesPending ? "Loading…" : "Choose a category"} />
                        </SelectTrigger>
                        <SelectContent>
                          {(categories ?? []).map((category) => (
                            <SelectItem key={category.id} value={category.id}>
                              {category.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  />
                  {errors.categoryId ? <FieldError message={errors.categoryId.message} /> : null}
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="slug">URL slug</Label>
                <Input
                  id="slug"
                  className="font-mono text-sm"
                  placeholder="modern-3-seater-fabric-sofa"
                  {...register("slug")}
                  onChange={(event) => {
                    setSlugManuallyEdited(true);
                    register("slug").onChange(event);
                  }}
                />
                <p className="text-xs text-muted-foreground">
                  Auto-generated from the name — the product page will live at{" "}
                  <span className="font-mono">/products/{watch("slug") || "…"}</span>
                </p>
                {errors.slug ? <FieldError message={errors.slug.message} /> : null}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="shortDescription">Short description (recommended)</Label>
                <Textarea
                  id="shortDescription"
                  rows={2}
                  placeholder="One-line summary shown on product cards and search results."
                  {...register("shortDescription")}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="description">Full description</Label>
                <Textarea
                  id="description"
                  rows={6}
                  placeholder="Tell customers about construction, comfort, care and what makes this piece special."
                  {...register("description")}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Photos</CardTitle>
              <CardDescription>
                First image is the catalogue cover. Reorder with the arrows; alt text helps Google and accessibility.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ImageUploader value={gallery} onChange={setGallery} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Pricing & availability</CardTitle>
              <CardDescription>Leave the price blank to show “Enquire for price”.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="price">Selling price (₹)</Label>
                  <Input id="price" type="number" min="0" step="1" placeholder="24999" {...register("price")} />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="originalPrice">Original price (₹, for strike-through)</Label>
                  <Input id="originalPrice" type="number" min="0" step="1" placeholder="32999" {...register("originalPrice")} />
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label>Availability *</Label>
                  <Controller
                    control={control}
                    name="availability"
                    render={({ field }) => (
                      <Select value={field.value} onValueChange={field.onChange}>
                        <SelectTrigger aria-label="Availability">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {AVAILABILITY_OPTIONS.map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="deliveryInfo">Delivery information</Label>
                  <Input id="deliveryInfo" placeholder="e.g. Free delivery across Mumbai, 5–7 days" {...register("deliveryInfo")} />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Specifications</CardTitle>
              <CardDescription>Dimensions, materials and finish options.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-4">
                <div className="space-y-1.5">
                  <Label htmlFor="dimensionWidth">Width</Label>
                  <Input id="dimensionWidth" type="number" min="0" step="0.1" placeholder="200" {...register("dimensionWidth")} />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="dimensionDepth">Depth</Label>
                  <Input id="dimensionDepth" type="number" min="0" step="0.1" placeholder="90" {...register("dimensionDepth")} />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="dimensionHeight">Height</Label>
                  <Input id="dimensionHeight" type="number" min="0" step="0.1" placeholder="85" {...register("dimensionHeight")} />
                </div>
                <div className="space-y-1.5">
                  <Label>Unit</Label>
                  <Controller
                    control={control}
                    name="dimensionUnit"
                    render={({ field }) => (
                      <Select value={field.value} onValueChange={field.onChange}>
                        <SelectTrigger aria-label="Dimension unit">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {DIMENSION_UNITS.map((unit) => (
                            <SelectItem key={unit} value={unit}>{unit}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  />
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="material">Material</Label>
                  <Input id="material" placeholder="e.g. Solid sheesham wood frame" {...register("material")} />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="finish">Finish</Label>
                  <Input id="finish" placeholder="e.g. Honey teak, matte lacquer" {...register("finish")} />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="coloursText">Colour options</Label>
                <Input id="coloursText" placeholder="Warm Grey, Beige, Teal" {...register("coloursText")} />
                <p className="text-xs text-muted-foreground">Separate multiple colours with commas.</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Side column */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Publication</CardTitle>
              <CardDescription>Control when this product is visible on the website.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <Label htmlFor="published" className="cursor-pointer">Published</Label>
                  <p className="text-xs text-muted-foreground">
                    {watch("published") ? "Live — visitors can see this product." : "Draft — only staff can see it."}
                  </p>
                </div>
                <Controller
                  control={control}
                  name="published"
                  render={({ field }) => (
                    <Switch id="published" checked={field.value} onCheckedChange={field.onChange} />
                  )}
                />
              </div>
              <div className="flex items-center justify-between gap-4">
                <div>
                  <Label htmlFor="isFeatured" className="cursor-pointer">Featured / bestseller</Label>
                  <p className="text-xs text-muted-foreground">Showcased in the homepage “Featured Furniture” row.</p>
                </div>
                <Controller
                  control={control}
                  name="isFeatured"
                  render={({ field }) => (
                    <Switch id="isFeatured" checked={field.value} onCheckedChange={field.onChange} />
                  )}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>SEO</CardTitle>
              <CardDescription>Generated automatically — edit only if you want something different.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="seoTitle">SEO title</Label>
                <Input
                  id="seoTitle"
                  placeholder={seoPreview}
                  {...register("seoTitle")}
                  onChange={(event) => {
                    setSeoTitleManuallyEdited(true);
                    register("seoTitle").onChange(event);
                  }}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="seoDescription">Meta description</Label>
                <Textarea
                  id="seoDescription"
                  rows={3}
                  placeholder="Auto-filled from the short description when left empty."
                  {...register("seoDescription")}
                  onChange={(event) => {
                    setSeoDescManuallyEdited(true);
                    register("seoDescription").onChange(event);
                  }}
                />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Sticky save bar */}
      <div className="fixed inset-x-0 bottom-0 z-20 border-t border-border bg-background/95 p-3 backdrop-blur lg:left-60">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-3">
          <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
            {isDirty ? (
              <>
                <TriangleAlert className="h-3.5 w-3.5 text-amber-500" aria-hidden />
                Unsaved changes
              </>
            ) : (
              "All changes saved"
            )}
          </p>
          <div className="flex gap-2">
            <Button type="button" variant="outline" onClick={() => router.push("/admin/products")}>
              Cancel
            </Button>
            <Button type="submit" disabled={pending} className="gap-2">
              {pending ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : <Save className="h-4 w-4" aria-hidden />}
              {isEdit ? "Save changes" : "Create product"}
            </Button>
          </div>
        </div>
      </div>
    </form>
  );
}

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return (
    <p role="alert" className="text-xs font-medium text-destructive">
      {message}
    </p>
  );
}
