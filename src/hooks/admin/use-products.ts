"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { api } from "@/lib/client/api";
import type { Paginated, ProductDto, ProductListParams } from "@/types";

/** Admin product hooks — one place that knows the product API contract. */

export function useAdminProducts(params: ProductListParams) {
  return useQuery({
    queryKey: ["admin", "products", params],
    queryFn: () => {
      const search = new URLSearchParams();
      if (params.search) search.set("search", params.search);
      if (params.status) search.set("status", params.status);
      if (params.availability) search.set("availability", params.availability);
      if (params.categoryId) search.set("categoryId", params.categoryId);
      if (params.featured !== undefined) search.set("featured", String(params.featured));
      if (params.sort) search.set("sort", params.sort);
      search.set("page", String(params.page ?? 1));
      search.set("pageSize", String(params.pageSize ?? 20));
      return api.get<Paginated<ProductDto>>(`/api/products?${search.toString()}`);
    },
  });
}

export function useAdminProduct(id: string) {
  return useQuery({
    queryKey: ["admin", "products", "detail", id],
    queryFn: () => api.get<ProductDto>(`/api/products/${id}`),
    enabled: Boolean(id),
  });
}

function useInvalidateProducts() {
  const queryClient = useQueryClient();
  return () => {
    queryClient.invalidateQueries({ queryKey: ["admin", "products"] });
    queryClient.invalidateQueries({ queryKey: ["catalogue"] });
    queryClient.invalidateQueries({ queryKey: ["admin", "dashboard"] });
  };
}

export function useCreateProduct() {
  const invalidate = useInvalidateProducts();
  return useMutation({
    mutationFn: (input: unknown) => api.post<ProductDto>("/api/products", input),
    onSuccess: (product) => {
      invalidate();
      toast.success(`“${product.name}” created${product.status === "PUBLISHED" ? " and live on the site" : " as a draft"}.`);
    },
  });
}

export function useUpdateProduct(id: string) {
  const invalidate = useInvalidateProducts();
  return useMutation({
    mutationFn: (input: unknown) => api.put<ProductDto>(`/api/products/${id}`, input),
    onSuccess: (product) => {
      invalidate();
      toast.success(`“${product.name}” saved.`);
    },
  });
}

export function useSetProductStatus() {
  const invalidate = useInvalidateProducts();
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: "DRAFT" | "PUBLISHED" }) =>
      api.patch<ProductDto>(`/api/products/${id}/status`, { status }),
    onSuccess: (product) => {
      invalidate();
      toast.success(
        product.status === "PUBLISHED"
          ? `“${product.name}” is now live on the website.`
          : `“${product.name}” unpublished — visitors can no longer see it.`,
      );
    },
  });
}

export function useDuplicateProduct() {
  const invalidate = useInvalidateProducts();
  return useMutation({
    mutationFn: (id: string) => api.post<ProductDto>(`/api/products/${id}/duplicate`),
    onSuccess: (product) => {
      invalidate();
      toast.success(`Duplicated as draft “${product.name}” (${product.sku}).`);
    },
  });
}

/** Toggle availability (in stock / unavailable) without touching other fields. */
export function useSetAvailability() {
  const invalidate = useInvalidateProducts();
  return useMutation({
    mutationFn: ({ id, availability }: { id: string; availability: "AVAILABLE" | "UNAVAILABLE" | "MADE_TO_ORDER" }) =>
      api.put<ProductDto>(`/api/products/${id}`, { availability }),
    onSuccess: (product) => {
      invalidate();
      toast.success(`“${product.name}” marked ${product.availability === "AVAILABLE" ? "available" : "unavailable"}.`);
    },
  });
}

export function useDeleteProduct() {
  const invalidate = useInvalidateProducts();
  return useMutation({
    mutationFn: (id: string) => api.delete<{ ok: true }>(`/api/products/${id}`),
    onSuccess: () => {
      invalidate();
      toast.success("Product deleted.");
    },
  });
}
